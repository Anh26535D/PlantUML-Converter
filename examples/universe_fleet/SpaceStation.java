package com.universe.arch;

import com.universe.fleet.Starship; // INTER-PACKAGE RELATIONSHIP
import java.util.List;

/**
 * High-level architecture of a Space Station
 */
public class SpaceStation extends OrbitalStructure implements IMaintainable {
    // COMPOSITION: Lifecycle is strictly managed here
    private final LifeSupportSystem lifeSupport = new LifeSupportSystem();
    private final StructuralIntegrity hull = new StructuralIntegrity();

    // AGGREGATION: Docking bays exist independently but are grouped here
    private List<DockingBay> dockingBays;

    // ASSOCIATION: Fleet starships can dock here
    private List<Starship> dockedStarships; // Cross-package association

    // ASSOCIATION: Pilots come and go
    private Pilot activeDutyPilot;

    public void executeMission(MissionControl mc) { // DEPENDENCY
        mc.authorize();
        lifeSupport.checkStatus();
    }

    @Override
    public void performMaintenance(Toolkit tools) { // DEPENDENCY
        tools.calibrate();
    }
}

abstract class OrbitalStructure {
}

interface IMaintainable {
    void performMaintenance(Toolkit t);
}

class LifeSupportSystem {
    public void checkStatus() {
    }
}

class StructuralIntegrity {
}

class DockingBay {
}

class Pilot {
}

class MissionControl {
    public void authorize() {
    }
}

class Toolkit {
    public void calibrate() {
    }
}
