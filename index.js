const http = require("http");
const { Pool } = require("pg");

const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS names (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);

  console.log("Database ready");
}

const server = http.createServer(async (req, res) => {
  try {
    // GET /names
    if (req.method === "GET" && req.url === "/names") {
      const result = await pool.query(`
        SELECT id, name
        FROM names
        ORDER BY id
      `);

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      return res.end(JSON.stringify(result.rows));
    }

    // POST /names
    if (req.method === "POST" && req.url === "/names") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body);

          if (!data.name) {
            res.writeHead(400, {
              "Content-Type": "application/json",
            });

            return res.end(
              JSON.stringify({
                error: "name is required",
              }),
            );
          }

          const result = await pool.query(
            `
            INSERT INTO names (name)
            VALUES ($1)
            RETURNING id, name
            `,
            [data.name],
          );

          res.writeHead(201, {
            "Content-Type": "application/json",
          });

          res.end(JSON.stringify(result.rows[0]));
        } catch (err) {
          console.error(err);

          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          res.end(
            JSON.stringify({
              error: "Invalid JSON",
            }),
          );
        }
      });

      return;
    }

    res.writeHead(404, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        error: "Not found",
      }),
    );
  } catch (error) {
    console.error(error);

    res.writeHead(500, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        error: "Internal server error",
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
