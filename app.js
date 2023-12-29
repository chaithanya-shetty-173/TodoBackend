const express = require("express");
const app = express();
const path = require("path");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The server is running at port:3000");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
  }
};
initializeDbAndServer();

//API 1
app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  console.log(request.query);
  const priority_values = ["HIGH", "MEDIUM", "LOW"];
  const status_values = ["TO DO", "IN PROGRESS", "DONE"];
  const category_values = ["WORK", "HOME", "LEARNING"];
  if (
    status_values.includes(status) &&
    priority_values.includes(priority) &&
    category_values.includes(category)
  ) {
    const getTodoQuery = `
  SELECT id,todo,category,priority,status,due_date AS dueDate
  FROM todo
  WHERE status LIKE '%${status}%'
  AND priority LIKE '%${priority}%'
  AND todo LIKE '%${search_q}%'
  AND category LIKE '%${category}';`;
    const todo_list = await db.all(getTodoQuery);
    console.log(todo_list);
    response.send(todo_list);
    response.status(200);
  } else {
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const getTodoQuery = `
  SELECT id,todo,priority,status,category,due_date AS dueDate
  FROM todo
  WHERE id=${todoId};`;
  const todo_list = await db.get(getTodoQuery);
  console.log(todo_list);
  response.send(todo_list);
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(typeof date);
  console.log(date);
  const inputDate = new Date(date);
  console.log(typeof inputDate);
  const RDate = format(inputDate, "yyyy-MM-dd");
  console.log(typeof RDate);
  const getTodoQuery = `
  SELECT id,todo,priority,status,category,due_date AS dueDate
  FROM todo
  WHERE due_date LIKE '%${RDate}';`;
  const todo_list = await db.all(getTodoQuery);
  console.log(todo_list);
  response.send(todo_list);
});

//API 4
app.use(express.json());
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  const priority_values = ["HIGH", "MEDIUM", "LOW"];
  const status_values = ["TO DO", "IN PROGRESS", "DONE"];
  const category_values = ["WORK", "HOME", "LEARNING"];
  console.log(priority_values.includes(priority));
  console.log(status_values.includes(status));
  console.log(dueDate);
  console.log(id, todo, priority, status);

  const insertTodoQuery = `
    INSERT INTO
    todo (id,todo,category,priority,status,due_date)
    VALUES(
        ${id},
        '${todo}',
        '${category}',
        '${priority}',
        '${status}',
        '${dueDate}'
        
    );`;
  const dbResponse = await db.run(insertTodoQuery);
  const todo_id = dbResponse.lastID;
  response.send("Todo Successfully Added");
  console.log(todo_id);
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  console.log(todoDetails);
  const previousTodoQuery = `
  SELECT *
  FROM todo
  WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    priority = "",
    status = previousTodo.status,
    due_date = previousTodo.due_date,
  } = todoDetails;
  console.log(todo, priority, status);

  const updateTodoQuery = `
  UPDATE todo
  SET 
    todo='${todo}',
    category='${category}',
    priority='${priority}',
    status='${status}',
    due_date=${due_date};
  WHERE id=${todoId};`;
  await db.run(updateTodoQuery);
  if (previousTodo.todo != todo) {
    response.status(400);
    response.send("Todo Updated");
  } else if (previousTodo.priority != priority) {
    response.status(400);
    response.send("Priority Updated");
  } else if (previousTodo.status != status) {
    response.status(400);
    response.send("Status Updated");
  } else if (previousTodo.category != category) {
    response.status(400);
    response.send("Category Updated");
  } else {
    response.status(400);
    response.send("Due Date Updated");
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
    todo
    WHERE
    id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
  console.log("done");
});

module.exports = app;
