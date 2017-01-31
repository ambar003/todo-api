var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var app = express();
var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API root');
});

app.get('/todos', function(req, res) {
	var query = req.query;
	var where = {};
	if (query.hasOwnProperty('completed')) {
		if (query.completed === 'true') {
			where.completed = true;
		} else {
			where.completed = false;
		}
	}
	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}
	db.todo.findAll({
		where: where
	}).then(function(todos) {
		res.json(todos);
	}, function(e) {
		res.status(500).send();
	});
});

app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findById(todoId).then(function(todo) {
		if (todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).json(e);
	});
});

app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	db.todo.create(body).then(function(todo) {
		res.json(todo.toJSON());
	}, function(e) {
		res.status(400).json(e);
	});
});

app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function(rowsDeleted) {
		if (rowsDeleted == 1) {
			res.status(204).send();
		} else {
			res.status(404).json({
				error: 'no todo found'
			});
		}
	}, function() {
		res.staus(500).send();
	});
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

app.post('/users', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');
	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
	}, function(e) {
		res.status(400).json({
			error:'Email already exist'
		});
	});
});

app.post('/users/login', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');
	db.user.authenticate(body).then(function(user) {
		res.json(user.toPublicJSON());
	}, function(e) {
		res.status(401).send();
	});
});

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('server started');
	});
});