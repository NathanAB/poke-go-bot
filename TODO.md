Issues:
- Catching:
- - Successive SUCCESS and FLED messages
- Pokemon Management
- - Incorrect evolution messages
- - Running concurrently with other Pokemon Management calls when short distances between waypoints

Item Management:
- ~~Inventory management~~
- ~~Drop certain items on pickup (configurable)~~

Egg Management:
- Determine when eggs are obtained
- Record hatched pokemon
- Incubate eggs based on longest distance

Pokemon Management:
- Batch evolves at waypoints only when an evolvable threshold is met, AND use lucky eggs right before batch evolves to maximize. For this strategy only evolve 1st tier pokemon. Also trigger evolves when pokemon limit is close to being reached (i.e. 220).
- Destroy pincers, fuck
- When recycling, calculate how many should remain for evolution targets
- Use Lucky Egg prior to evolving pokemon
- Fix evolution logic (can potentially keep evolving first form pokemon instead of available second form)
- Trim high CP low rarity pokemon (Pinsirs) (Need to reference Pokedex rarity)
- Implement Pokemon Management strategies
- At high level (25?) evolve for missing evolutions

Movement:
- ~~Sweep target areas~~
- Hover around heavily lured areas?

Player Metrics:
- ~~Record Pokemon Caught/Hatched/Evolved~~
- Record Distance Walked
- Record Levels Gained

Automation: 
- Exit upon milestone completion
  - Distance Walked
  - XP Gained
  - Pokemon Caught
- Take 5 minute breaks after 1 hr
- Configure multi-account setup

Luxuries:
- Pokemon Hunting Mode (For rarity)
- Need to wait between requests made not between logic (Pokemon Management can take a long time)