package com.example

class Product(val id: String, var name: String) {
    fun display(): Unit {
        println("Product: $name")
    }
}

abstract class Shape {
    abstract fun area(): Double
}

class Circle(val radius: Double) : Shape() {
    override fun area(): Double = 3.14 * radius * radius
}

object AppConfig {
    val version = "1.0.0"
}
