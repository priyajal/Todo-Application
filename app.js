const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbResponseObjResponse = (todo) => ({
  id: todo.id,
  todo: todo.todo,
  category: todo.category,
  priority: todo.priority,
  status: todo.status,
  dueDate: todo.due_date,
});

// API 1
app.get("/todos/", async (request, response) => {
  const {
    search_q = "",
    priority = "",
    status = "",
    category = "",
  } = request.query;

  const getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%' AND category LIKE '%${category}%'
        AND status LIKE '%${status}%'
        AND priority LIKE '%${priority}%';`;

  const data = await database.all(getTodosQuery);
  response.send(data.map((item) => convertDbResponseObjResponse(item)));
});

//API GET PARTICULAR TODO
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(convertDbResponseObjResponse(todo));
});

//API GET TODO BASED ON SPECIFIC DATE
app.get("/agenda", async (request, response) => {
  const { date } = request.query;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      due_date = '${date}';`;
  const todo = await database.all(getTodoQuery);
  response.send(todo.map((item) => convertDbResponseObjResponse(item)));
});

//API TO POST TODO

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status,category,due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}','${category}','${dueDate}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API UPDATE A TODO

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category},
      due_date = '${dueDate}
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API DELETE TODO
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
