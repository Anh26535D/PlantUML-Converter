package com.universe.services;

import com.universe.arch.SpaceStation;
import com.universe.fleet.Starship;
import java.util.List;

/**
 * Service to manage the entire fleet across different space stations
 */
public class FleetManager {
    // ASSOCIATION: Oversees multiple stations
    private List<SpaceStation> planetaryStations;

    // AGGREGATION: Tracks all registered starships
    private List<Starship> activeUnits;

    public void dispatch(Starship unit, SpaceStation destination) { // DEPENDENCY on both
        unit.setDestination(destination);
    }
}
