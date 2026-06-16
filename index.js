const http = require("http");
const { Pool } = require("pg");

const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY,
      count INTEGER NOT NULL
    )
  `);

  await pool.query(`
    INSERT INTO visits (id, count)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `);

  console.log("Database ready");
}

const server = http.createServer(async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE visits
      SET count = count + 1
      WHERE id = 1
      RETURNING count
    `);

    const visits = result.rows[0].count;

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        message: "Hello from Node.js API!",
        visits,
        time: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error(error);

    res.writeHead(500, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        error: "Database error",
      }),
    );
  }
});

initDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`API running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
