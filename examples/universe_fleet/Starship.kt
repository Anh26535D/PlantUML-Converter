package com.universe.fleet

import com.universe.arch.SpaceStation // INTER-PACKAGE RELATIONSHIP

/**
 * Advanced Starship architecture in Kotlin
 */
class Starship(
    // COMPOSITION via primary constructor
    private val core: WarpCore,
    // AGGREGATION via primary constructor
    val drones: List<RepairDrone>
) : SpaceVehicle() {

    // ASSOCIATION: Home base space station
    var homeBase: SpaceStation? = null // Cross-package association

    // ASSOCIATION: Captain can be reassigned
    var captain: Captain? = null
    
    // COMPOSITION in body
    private val shieldGen = ShieldGenerator()

    fun engage(target: CombatTarget) { // DEPENDENCY
        core.outputPower()
        target.takeDamage(100)
    }
}

open class SpaceVehicle
class WarpCore {
    fun outputPower() {}
}
class RepairDrone
class Captain
class ShieldGenerator
class CombatTarget {
    fun takeDamage(amount: Int) {}
}
