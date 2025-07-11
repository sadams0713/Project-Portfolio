//**Retrieval of approved and partial loads showcasing direct sql query and table joins**//

        [HttpGet("approved-load-endpoint")]
        public ActionResult<IEnumerable<LoadDataDto>> GetLoadData(string loadName)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    connection.Open();
                    string sqlQuery = @"
                        SELECT
                            [Table1].[LoadIdentifier] AS LoadName,
                            [Table2].[TreeIdentifier] AS TreeNumber,
                            SUM([Table3].[Quantity]) AS QuantityPerTree,
                            [Table4].[PartNumber] AS PartNumber,
                            SUM([Table3].[Quantity]) AS Quantity,
                            [Table1].[LotId] AS GidLot
                        FROM ...
                        WHERE [Table1].[LoadIdentifier] = @LoadName
                        GROUP BY [Table1].[LoadIdentifier], ...";

                    using (SqlCommand command = new SqlCommand(sqlQuery, connection))
                    {
                        command.Parameters.AddWithValue("@LoadName", loadName);

                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            var loadDatas = new List<LoadDataDto>();

                            while (reader.Read())
                            {
                                var loadData = new LoadDataDto
                                {
                                    LoadName = reader["LoadName"].ToString(),
                                    TreeNumber = reader["TreeNumber"].ToString(),
                                    QuantityPerTree = Convert.ToInt32(reader["QuantityPerTree"]),
                                    PartsData = new List<PartDataDto>(),
                                    GidLot = reader["GidLot"].ToString()
                                };

                                var partData = new PartDataDto
                                {
                                    PartNumber = reader["PartNumber"].ToString(),
                                    Quantity = Convert.ToInt32(reader["Quantity"])
                                };

                                loadData.PartsData.Add(partData);
                                loadDatas.Add(loadData);
                            }

                            return Ok(loadDatas);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("partial-load-endpoint")]
        public async Task<ActionResult<IEnumerable<TableModel>>> GetPartialLoads()
        {
            var partialLoads = await _context.Stuff
                .Where(f => f.ImgApprovalSignature == null && f.ImgReleaseSignature != null)
                .ToListAsync();
            return Ok(partialLoads);
        }

        [HttpPut("endpoint-to-approve")]
        public async Task<ActionResult> ApproveLoad(int iid, [FromBody] ApprovalDto approvalDto)
        {
            try
            {
                var load = await _context.TableModel.FindAsync(iid);
                if (load == null)
                {
                    return NotFound();
                }

                if (!IsValidBase64String(approvalDto.ApprovalSignature))
                {
                    return BadRequest("Invalid Base64 encoding for approval signature.");
                }

                load.ImgApprovalSignature = approvalDto.ApprovalSignature;
                load.DtmApproved = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { Message = "Load approved successfully" });
            }
            catch (DbUpdateException ex)
            {
                Console.Error.WriteLine(ex);
                return StatusCode(500, new { Message = "Failed to update load. If issue persists, please contact your supervisor." });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex);
                return StatusCode(500, new { Message = "Internal Server Error" });
            }
        }

        private bool IsValidBase64String(string base64)
        {
            Span<byte> buffer = new Span<byte>(new byte[base64.Length]);
            return Convert.TryFromBase64String(base64, buffer, out _);
        }
    }

    public class LoadDataDto
    {
        public string LoadName { get; set; }
        public string TreeNumber { get; set; }
        public int QuantityPerTree { get; set; }
        public List<PartDataDto> PartsData { get; set; }
        public string GidLot { get; set; }
    }

    public class PartDataDto
    {
        public string PartNumber { get; set; }
        public int Quantity { get; set; }
    }

    public class ApprovalDto
    {
        public string ApprovalSignature { get; set; }
    }
}
