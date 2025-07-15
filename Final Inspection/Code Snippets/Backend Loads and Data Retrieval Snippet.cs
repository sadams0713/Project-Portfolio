//**Requests to get Loads and Data By Name. Please Excuse any discrepancies or inconsistencies you find with aliases, tables, etc. **//

[ApiController]
[Route("api/records")]
public class RecordLookupController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public RecordLookupController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // 🔍 Retrieves distinct reference identifiers (e.g., load names) based on filtering rules
    [HttpGet("by-type")]
    public ActionResult<IEnumerable<string>> GetReferenceNames(string type)
    {
        try
        {
            string connStr = _configuration.GetConnectionString("SecondaryDb");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string query = @"
                    SELECT DISTINCT [t1].[RefId]
                    FROM [Db].[Schema].[RefTable] AS t1
                    WHERE [t1].[ColA] IS NOT NULL
                      AND [t1].[ColB] IS NULL
                      AND NOT EXISTS (
                          SELECT 1
                          FROM [Db].[Schema].[StatusTable] AS t2
                          WHERE t2.[RefLookup] = t1.[RefId]
                            AND t2.[SignedField] IS NOT NULL)";

                // Conditional filtering by type (like aliases or prefixes)
                if (type == "GroupX")
                {
                    query += " AND [t1].[RefId] LIKE 'X-%'";
                }
                else if (type == "GroupY")
                {
                    query += " AND ([t1].[RefId] LIKE 'Y-%' OR [t1].[RefId] LIKE 'Z-%')";
                }

                query += " ORDER BY [t1].[RefId]";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        var resultList = new List<string>();

                        while (reader.Read())
                        {
                            string refName = reader["RefId"].ToString();
                            resultList.Add(refName);
                        }

                        return Ok(resultList);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    // 🔄 Returns grouped detail data (e.g., tree totals, part numbers) for a given reference
    [HttpGet("details-by-name")]
    public ActionResult<IEnumerable<GroupedRecordDto>> GetDetailsByRefName(string name)
    {
        try
        {
            string connStr = _configuration.GetConnectionString("PrimaryDb");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string query = @"
                    SELECT
                        T1.RefId AS RefName,
                        T5.FixtureCode AS FixtureGroup,
                        SUM(T2.Units) AS UnitsPerFixture,
                        T3.Component AS ComponentCode,
                        SUM(T4.Units) AS TotalUnits,
                        T1.RefId AS MasterGroup
                    FROM [Db].[Schema].[DataTable] AS T4
                    LEFT JOIN [Db].[Schema].[ComponentTable] AS T3 ON T3.ComponentId = T2.ComponentId
                    LEFT JOIN [Db].[Schema].[RefTable] AS T1 ON T1.RefId = T2.RefId
                    LEFT JOIN [Db].[Schema].[FixtureTable] AS T5 ON T5.FixtureId = T2.FixtureId
                    WHERE T1.RefId = @Name
                    GROUP BY T2.TreeId, T5.TreeCode, T4.Units, T1.RefId";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Name", name);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        var groupedResults = new List<GroupedRecordDto>();

                        while (reader.Read())
                        {
                            var group = new GroupedRecordDto
                            {
                                RefName = reader["RefName"].ToString(),
                                FixtureGroup = reader["TreeGroup"].ToString(),
                                UnitsPerFixture = Convert.ToInt32(reader["UnitsPerTree"]),
                                ComponentList = new List<ComponentDto>(),
                                MasterGroup = reader["MasterGroup"].ToString()
                            };

                            var component = new ComponentDto
                            {
                                ComponentCode = reader["ComponentCode"].ToString(),
                                TotalUnits = Convert.ToInt32(reader["TotalUnits"])
                            };

                            group.ComponentList.Add(component);
                            groupedResults.Add(group);
                        }

                        return Ok(groupedResults);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}

public class GroupedRecordDto
{
    public string RefName { get; set; }
    public string FixtureGroup { get; set; }
    public int UnitsPerFixture { get; set; }
    public List<ComponentDto> ComponentList { get; set; }
    public string MasterGroup { get; set; }
}

public class ComponentDto
{
    public string ComponentCode { get; set; }
    public int TotalUnits { get; set; }
}
