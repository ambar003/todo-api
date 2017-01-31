// here we store todos locally in an object array
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();
var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API root');
});

app.get('/todos', function(req, res) {
	var queryParams = req.query;
	var filtertodos = todos;
	if (queryParams.hasOwnProperty('completed')) {
		if (queryParams.completed == 'true') {
			filtertodos = _.where(filtertodos, {
				completed: true
			});
		} else {
			filtertodos = _.where(filtertodos, {
				completed: false
			});
		}
	}
	if(queryParams.hasOwnProperty('q')&& queryParams.q.length()>0){
          filtertodos = _.filter(filtertodos,function(todo){
              return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase())>-1;
          });
	}
	res.json(filtertodos);
});

app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {
		id: todoId
	});
	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
	}
});

app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length == 0) {
		res.status(400).send();
	}
	body.description = body.description.trim();
	body.id = todoNextId++;
	todos.push(body);
	res.json(todos);
});

app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {
		id: todoId
	});
	if (!matchedTodo) {
		res.status(404).json({
			'Error': 'No todo found'
		});
	} else {
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo);
	}

});

app.put('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {
		id: todoId
	});
	var body = _.pick(req.body, 'description', 'completed');
	var validattributes = {};

	if (!matchedTodo) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('completed') && _.isBoolean('completed')) {
		validattributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		res.status(400).send();
	}

	if (body.hasOwnProperty('description') && (_.isString(body.description) || body.description.trim().length != 0)) {
		validattributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		res.status(400).send();
	}

	// using extend method of underscore copy objects

	_.extend(matchedTodo, validattributes);
	res.json(matchedTodo);
});

app.listen(PORT, function() {
	console.log('server started');
});