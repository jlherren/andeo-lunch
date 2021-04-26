# API documentation

## Object definition

Overview of object structures used in this API

### User

```
{
    "id": <user-id>
    "name: "<display-name>"
    "balances": {
        "points": <point-balance>,
        "money": <money-balance>,
    }
}
```

### Event

```
{
    "id": <event-id>
    "type: <event-type-id>
    "date: "<date>"
    "name: "<display-name>"
    "costs": {
        "points": <point-cost>,
        "money": <money-cost>,
    },
    "factors": {
        "vegetarian": {
            "money": <number>
        }
    }
}
```

### Event type

```
"lunch"
"event"
"label"
"transaction"
```

### Participation

```
{
    "user": <user-id>,
    "event": <event-id>,
    "type": "<participation-type>",
    "credits": {
        "points": <number>
        "money": <number>
    }
}
```

### Participation type

```
"omnivorous" | "vegetarian" | "out-out" | "undecided"
```

### Transaction

```
{
    "id": <transaction-id>,
    "date": "<date>",
    "user": <user-id>,
    "contraUser": <user-id>,
    "event": <event-id>,
    "currency": <currency>,
    "amount": <number>,
    "balance": <number>
}
```

### Currencies

```
"points", "money"
```

## Account operations

### Logging in

Request:
```
POST /account/login
{ "username": "<username>", "password": "<password>" }
```

Response:
```
200 OK
{ "token": "<token>" }
```

```
401 Not Authorized
```

The token remains valid for 30 days by default, but this can be configured.
Most other request will require to receive this token in an authorization header:

```
Authorization: Bearer <token>
```

### Renew the token

The token expires after some time, after which a new login would be required.
However, a token can be renewed before it expires, and it is recommended to do
so at most once a day.  If desired, details about expiry can be found within
the token itself, which follows the JSON web token standard.

Request:
```
POST /accout/renew
Authorization: Bearer <current-token> 
```

Response:

```
200 OK
{ "token": "<new-token>" }
```

```
401 Not Authorized
```

## Miscellaneous data

### Get version

Query the version of the backend.

Request:
```
GET /version
```

Response:
```
200 OK
{"version": "0.0.1"}
```

## Users

### Get the user list

Request:
```
GET /users
```

Response:
```
200 OK
[
    <user-object>,
    ...
]
```

### Get single user

Request:
```
GET /users/<user-id>
```

Response:
```
200 OK
<user-object>
```

### Get user's transaction history

Request:
```
GET /users/<user-id>/transactions
```

Response:
```
200 OK
[
    <transaction-object>,
    ...
]
```

## Events

### Get the event list

Request:
```
GET /events
```

Response:
```
200 OK
[
    <event-object>,
    ...
]
```

### Get single event

Request:
```
GET /events/<event-id>
```

Response:
```
200 OK
<event-object>
```

### Create an event

Request:
```
POST /events
<event-object>
```

*Note:* The event object posted should not contain an event ID.

Response:
```
201 Created
Location: /events/<event-id>
```

### Update an event

Request:
```
POST /events/<event-id>
<event-object>
```

*Note:* Only the following keys are allowed in the posted object:
- name
- date
- costs
- factors

Response:
```
201 Created
Location: /events/<event-id>
```

### Get event participations

Request:
```
GET /events/<event-id>/participations
```

Response:
```
200 OK
[
    <participation>,
    ...
]
```

### Save/update participation

Request:
```
POST /events/<event-id>/participations/<user-id>
<participation>
```

*Note:* The participation should not contain the event ID and user ID as these are implied from the URL

Response:
```
204 No Content
```

### Delete participation

Request:
```
DELETE /events/<event-id>/participations/<user-id>
```

Response:
```
204 No Content
```
