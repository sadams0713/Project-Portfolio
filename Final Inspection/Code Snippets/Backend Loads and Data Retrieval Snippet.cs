//**Requests to get Loads and Data By Name. Please Excuse any discrepancies or inconsistencies you find with aliases, tables, etc. **//

[HttpGet("By Load Name ")]
        public ActionResult<IEnumerable<string>> GetLoadNames(string loadType)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("Secondary String");
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    connection.Open();

                    string sqlQuery = @"
                SELECT DISTINCT [strLot]
                FROM [YourDatabase].[Schema].[table] AS ll
                WHERE [ll].[column1] IS NOT NULL
                AND [ll].[column2] IS NULL 
                AND NOT EXISTS (
                    SELECT 1
                    FROM [Database].[Schema].[table] AS f
                    WHERE f.[column for LoadName] = ll.[column for Lot]
                    AND (f.[column for ReleaseSignature] IS NOT NULL))";

                    if (loadType == "Alias")
                    {
                        sqlQuery += " AND [ll].[ column for Lot] LIKE “'Alias2'";
                    }
                    else if (loadType == "Alias3")
                    {
                        sqlQuery += " AND ([ll].[ column for Lot] LIKE 'Alias5' OR [ll].[ column for Lot] LIKE 'Another Alias')";
                    }

                    sqlQuery += " ORDER BY [ll].[ column for Lot]";

                    using (SqlCommand command = new SqlCommand(sqlQuery, connection))
                    {
                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            List<string> loadNames = new List<string>();

                            while (reader.Read())
                            {
                                string loadName = reader["strLot"].ToString();
                                loadNames.Add(loadName);
                            }

                            return Ok(loadNames);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("Load Data By Load Name")]
        public ActionResult<IEnumerable<LoadDataDto>> GetLoadData(string loadName)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("Another Connection String");
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    connection.Open();

                    string sqlQuery = @"
                        SELECT
                            [table1].[column] AS LoadName,
                            [column].[column] AS TreeNumber,
                            SUM([table2].[column]) AS QuantityPerTree,
                            [table3].[column] AS PartNumber,
                            SUM([table4].[column]) AS Quantity,
                            [table1].[column] AS GidLoad
                        FROM [DB].[Schema].[table4]
                        LEFT OUTER JOIN [DB].[Schema].[table3] ON [table3].[column] = [table2].[column]
                        LEFT OUTER JOIN [DB].[Schema].[table1] ON [table1].[column] = [table2].[column]
                        LEFT OUTER JOIN [DB].[Schema].[table5] AS [column] ON [table5].[column] = [tabl2].[column]
                        WHERE [table1].[column] = @LoadName
                        GROUP BY [table2].[column], [table5].[column], [table4].[column],[table1].[column]";

                    using (SqlCommand command = new SqlCommand(sqlQuery, connection))
                    {
                        command.Parameters.AddWithValue("@LoadName", loadName);

                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            List<LoadDataDto> loadDatas = new List<LoadDataDto>();

                            while (reader.Read())
                            {
                                LoadDataDto loadData = new LoadDataDto
                                {
                                    LoadName = reader["LoadName"].ToString(),
                                    TreeNumber = reader["TreeNumber"].ToString(),
                                    QuantityPerTree = Convert.ToInt32(reader["QuantityPerTree"]),
                                    PartsData = new List<PartDataDto>(),
                                    GidLoad = reader["GidLoad"].ToString()
                                };

                                PartDataDto partData = new PartDataDto
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
