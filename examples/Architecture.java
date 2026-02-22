package com.example.arch;

import java.util.List;

public class Controller {
    private Service service;
    private List<Entity> entities;
    
    public void process(Request req) {
        service.doSomething(req);
    }
}

class Service {
    private Repository repository;
    
    public Response doSomething(Request req) {
        return repository.find(req.getId());
    }
}

interface Repository {
    Response find(String id);
}

class DatabaseRepository implements Repository {
    private Database db;
}

class Database {}
class Request {
    public String getId() { return "1"; }
}
class Response {}
class Entity {}
