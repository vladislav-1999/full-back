import http from "node:http";

let tasks = [{ id: 1, title: "Выучить http-модуль", done: false }];

let nextId = 2;

// req - объект запроса
// res - объект ответа
// url - (например '/tasks' или '/tasks/3')

const server = http.createServer((req, res) => {
  const { method, url } = req;

  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const sendJson = (status, data) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };

  if (method === "GET" && url === "/tasks") {
    return sendJson(200, tasks);
  }

  if (method === "POST" && url === "/tasks") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);

        if (!parsed.title) {
          return sendJson(400, { error: "Title is required" });
        }

        const task = {
          id: nextId++,
          title: parsed.title,
          done: false,
        };

        tasks.push(task);
        return sendJson(201, task);
      } catch {
        return sendJson(400, { error: "Invalid JSON" });
      }
    });

    return;
  }

  const parts = url.split("/");

  if (parts[1] === "tasks" && parts[2]) {
    const id = Number(parts[2]);

    if (method === "GET") {
      const task = tasks.find((task) => task.id === id);

      if (!task) {
        return sendJson(404, { error: "Task not found" });
      }

      return sendJson(200, task);
    }

    if (method === "DELETE") {
      const index = tasks.findIndex((task) => task.id === id);

      if (index === -1) {
        return sendJson(404, { error: "Task not found" });
      }

      tasks.splice(index, 1);
      return sendJson(204, {});
    }

    if (method === "PATCH") {
      const task = tasks.find((task) => task.id === id);

      if (!task) {
        return sendJson(404, { error: "Task not found" });
      }

      let body = "";

      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        try {
          const parsed = JSON.parse(body);

          if (typeof parsed.done !== "boolean") {
            return sendJson(400, { error: "Done must be a boolean" });
          }

          task.done = parsed.done;

          return sendJson(200, task);
        } catch {
          return sendJson(400, { error: "Invalid JSON" });
        }
      });

      return;
    }
  }

  sendJson(404, { error: "Not found" });
});

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
