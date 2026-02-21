package com.example;

public class User {
    private String name;
    private int age;
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
}

interface Identifiable {
    String getId();
}

public class Employee extends User implements Identifiable {
    private String employeeId;
    
    @Override
    public String getId() {
        return employeeId;
    }
}
