//**Retrieval of approved and partial data showcasing direct sql query and table joins**//

[ApiController]
[Route("api/data")]
public class DataController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly GenericDbContext _context;

    public DataController(IConfiguration configuration, GenericDbContext context)
    {
        _configuration = configuration;
        _context = context;
    }

    // 🔍 Retrieves joined records using raw SQL with grouping (e.g., trees, part counts)
    [HttpGet("fetch-consolidated")]
    public ActionResult<IEnumerable<AggregateDto>> GetConsolidatedData(string referenceId)
    {
        try
        {
            string connStr = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string sql = @"
                    SELECT
                        A.RefCode AS RefName,
                        B.TreeId AS TreeRef,
                        SUM(C.Amount) AS SubTotal,
                        D.PartCode AS ComponentCode,
                        SUM(C.Amount) AS TotalAmount,
                        A.LotGroup AS LotRef
                    FROM ...
                    WHERE A.RefCode = @RefCode
                    GROUP BY A.RefCode, ...";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@RefCode", referenceId);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        var result = new List<AggregateDto>();

                        while (reader.Read())
                        {
                            var group = new AggregateDto
                            {
                                RefName = reader["RefName"].ToString(),
                                TreeRef = reader["TreeRef"].ToString(),
                                SubTotal = Convert.ToInt32(reader["SubTotal"]),
                                LotRef = reader["LotRef"].ToString(),
                                Parts = new List<ComponentDto>()
                            };

                            var component = new ComponentDto
                            {
                                ComponentCode = reader["ComponentCode"].ToString(),
                                TotalAmount = Convert.ToInt32(reader["TotalAmount"])
                            };

                            group.Parts.Add(component);
                            result.Add(group);
                        }

                        return Ok(result);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    // 🔎 Returns all partially approved records (approval is missing but release exists)
    [HttpGet("fetch-incomplete")]
    public async Task<ActionResult<IEnumerable<RecordModel>>> GetIncompleteRecords()
    {
        var items = await _context.Records
            .Where(r => r.SignatureApproved == null && r.SignatureReleased != null)
            .ToListAsync();

        return Ok(items);
    }

    // ✅ Marks a record as approved with timestamp and base64 validation
    [HttpPut("confirm-record")]
    public async Task<ActionResult> ConfirmRecord(int id, [FromBody] SignatureDto signatureInput)
    {
        try
        {
            var entry = await _context.Records.FindAsync(id);
            if (entry == null)
                return NotFound();

            if (!IsValidBase64(signatureInput.Signature))
                return BadRequest("Invalid Base64 encoding in signature payload.");

            entry.SignatureApproved = signatureInput.Signature;
            entry.TimestampApproved = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Record successfully approved." });
        }
        catch (DbUpdateException dbEx)
        {
            Console.Error.WriteLine(dbEx);
            return StatusCode(500, new { Message = "Database update failed. Please notify admin." });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex);
            return StatusCode(500, new { Message = "Unexpected error occurred." });
        }
    }

    // 🔐 Simple check for base64 format validity (used to verify digital signatures)
    private bool IsValidBase64(string value)
    {
        Span<byte> buffer = new Span<byte>(new byte[value.Length]);
        return Convert.TryFromBase64String(value, buffer, out _);
    }
}

   public class AggregateDto
{
    public string RefName { get; set; }
    public string TreeRef { get; set; }
    public int SubTotal { get; set; }
    public string LotRef { get; set; }
    public List<ComponentDto> Parts { get; set; }
}

public class ComponentDto
{
    public string ComponentCode { get; set; }
    public int TotalAmount { get; set; }
}

public class SignatureDto
{
    public string Signature { get; set; }
}
