const fs = require('fs');

const text = `Ankheg: (1-6, 15% Lair). Giant subterranean insects that spray acid to soften earth and prey.
Stats: 4d6 HP, Arm 2, Mandibles (d6+acid). [Acid Spray: Test AGI or armor reduced 1 tier. Can burrow underground to ambush.]
Variants (d6): 1-3: Standard | 4-5: Soldier (+1 Arm, +1 dmg) | 6: Queen (8d6 HP, Arm 3).
Renderable: Chitinous Plate (Crafting: Acid-Guard Cuirass / Alchemy: Potion of Stoneskin).
Basilisk: (1-4, 40% Lair). A reptilian horror whose baleful gaze locks the soul into a statue of stone.
Stats: 5d6 HP, Arm 1, Bite (d6). [Petrifying Gaze: Test INT or turn to stone. Mirrors reflect gaze back at her.]
Variants (d6): 1-3: Standard | 4-5: Greater (8d6 HP, Arm 2) | 6: Crimson (Gaze also causes d6 fire).
Renderable: Basilisk Eye (Crafting: Shield of Reflection / Alchemy: Potion of Ironskin).
Bear: (1-4, 20% Lair). Territorial beasts of the wild that defend their cubs with brutal force.
Stats: 4d6 HP, Arm 0, Claws (d6). [Maul: If both claws hit, auto-grapple and deal d6 crush dmg.]
Variants (d6): 1-3: Black | 4-5: Brown (+1 dmg) | 6: Cave (8d6 HP, Adv in dark).
Renderable: Gallbladder (Crafting: Cloak of Winter / Alchemy: Potion of Brutishness).
Chimera: (1-4, 40% Lair). A twisted fusion of lion, goat, and dragon born of dark, forgotten alchemy.
Stats: 6d6 HP, Arm 1, Bite/Horns/Claws (2d6). [Dragon Breath: 2d6 fire dmg, 20' cone.]
Variants (d6): 1-3: Red Head | 4: Blue (Lightning) | 5: Black (Acid) | 6: Gorgon (Petrify).
Renderable: Heart (Crafting: Charm of the Triune / Alchemy: Potion of Frenzy).
Cockatrice: (1-6, 30% Lair). A wretched avian-reptile hybrid that turns living things to stone with a peck.
Stats: 2d6 HP, Arm 0, Beak (d6). [Calcifying Peck: Test TOU or begin turning to stone.]
Variants (d6): 1-3: Standard | 4-5: Feral (+1d6 HP, Adv on Init) | 6: Venomous (Peck adds d6 poison).
Renderable: Wattle (Crafting: Gorgon's Blade / Alchemy: Potion of Beastform).
Crocodile: (3-24, 0% Lair). Ancient, armored predators that lurk beneath murky swamp waters waiting for a meal.
Stats: 3d6 HP, Arm 2, Bite (d6). [Death Roll: If bite hits, grappled and takes d6 dmg/round.]
Variants (d6): 1-3: Swamp | 4-5: Saltwater (5d6 HP, Arm 3) | 6: Prehistoric (8d6 HP).
Renderable: Hide (Crafting: Murk-walker Armor / Alchemy: Potion of Waterbreath).
Dragon: (1-4, 60% Lair). Apex magical predators that hoard gold and ancient wisdom in desolate peaks.
Stats: 8d6 HP, Arm 3, Bite/Claws (2d6). [Breath Weapon: 3d6 dmg, 20' radius. Wing Buffet: Test AGI or knocked down.]
Variants (d6): 1-2: Young (4d6 HP) | 3-4: Adult | 5: Old (Casts Tier 3 Magic) | 6: Ancient (Casts Tier 5 Magic).
Renderable: Scale (Crafting: Dragon-plate / Alchemy: Potion of Dragonscales).
Griffon: (2-12, 25% Lair). Proud, winged hunters that patrol the high crags with the sharp eyes of an eagle.
Stats: 4d6 HP, Arm 0, Talons/Beak (d6). [Swoop: +d6 dmg on diving charge. Fly.]
Variants (d6): 1-3: Standard | 4-5: Razorbeak (Ignores Arm 1) | 6: Royal (Mountable).
Renderable: Pinion (Crafting: Boots of Leaping / Alchemy: Potion of Shepherding).
Harpy: (2-12, 25% Lair). Vile, winged crones whose discordant songs lead lost travelers to their doom.
Stats: 2d6 HP, Arm 0, Talons (d6). [Siren Song: Test INT or be charmed and walk toward Harpy.]
Variants (d6): 1-3: Standard | 4-5: Blood-talon (Bleeding dmg) | 6: Hag-touched (Tier 1 Domination magic).
Renderable: Vocal Cords (Crafting: Lute of Allure / Alchemy: Potion of Control).
Hellhound: (2-8, 30% Lair). Fiendish canines from the infernal planes that track prey by the scent of burning soul.
Stats: 3d6 HP, Arm 1, Bite (d6). [Breathe Fire: Test AGI or take d6 fire dmg. Pack Hunters: Adv on attacks if ally engaged.]
Variants (d6): 1-3: Standard | 4-5: Cerberus (Two heads) | 6: Nessian (6d6 HP, Arm 2).
Renderable: Ember-gland (Crafting: Flaming Weapon Rune / Alchemy: Potion of Fire Breath).
Horse: (1-20, 0% Lair). Loyal steeds that have carried heroes across the realms since the dawn of time.
Stats: 2d6 HP, Arm 0, Hooves (d6). [Mount: Grants rider +d6 move and Adv on attacks.]
Variants (d6): 1-3: Riding | 4-5: Warhorse (3d6 HP, Arm 1) | 6: Nightmare (Undead, breathes smoke).
Renderable: Hoof/Hair (Crafting: Horseshoe of Luck / Alchemy: Potion of Striding).
Hydra: (1, 20% Lair). A swamp-dwelling multi-headed serpent that grows two new heads for every one severed.
Stats: 6d6 HP, Arm 1, Bite (d6)x4. [Regrowth: Regains 1d6 HP/round unless killed by fire/acid.]
Variants (d6): 1-3: Standard | 4-5: Pyrohydra (Fire breath) | 6: Cryohydra (Frost breath).
Renderable: Blood (Crafting: Amulet of Vigor / Alchemy: Potion of Trollsblood).
Lammasu: (2-8, 30% Lair). Benevolent, winged lions with human faces that guard sacred sites.
Stats: 5d6 HP, Arm 1, Talons (d6). [Holy Aura: Undead/Demons Test PRE to approach.]
Variants (d6): 1-3: Standard | 4-5: Golden (Tier 2 Illumination magic) | 6: Elder (8d6 HP, Tier 4 Illumination).
Renderable: Feather (Crafting: Holy Ward / Alchemy: Potion of Truesight).
Mandible Mole: (1-3, 40% Lair). Blind, chattering tunnel-dwellers that hunt by vibration and sense of touch.
Stats: 4d6 HP, Arm 2, Mandibles (d6). [Tremorsense: Cannot be surprised. Undermine: Collapse floor.]
Variants (d6): 1-3: Standard | 4-5: Crystal-clawed (Ignores Arm 1) | 6: Behemoth (8d6 HP, Swallows targets).
Renderable: Crystal Eye (Crafting: Helm of Darksight / Alchemy: Potion of Darksight).
Manticore: (1-4, 20% Lair). A winged beast with a human face and a tail that bristles with lethal spikes.
Stats: 4d6 HP, Arm 1, Bite (d6). [Tail Spikes: Ranged attack 30', d6 dmg. Fires 3 spikes/round.]
Variants (d6): 1-3: Standard | 4-5: Venom-tail (Poison dmg) | 6: Man-hunter (Mimics human cries).
Renderable: Spikes (Crafting: Darts of Seeking / Alchemy: Potion of Weaponskill).
Medusa: (1-3, 50% Lair). A cursed, snake-haired exile whose reflection can paralyze the heart.
Stats: 3d6 HP, Arm 0, Snakes (d6+poison). [Petrifying Gaze: Test INT or turn to stone.]
Variants (d6): 1-3: Standard | 4-5: Blindfolded (Immune to own gaze) | 6: Gorgon-queen (5d6 HP, Tier 2 Domination magic).
Renderable: Viper Hair (Crafting: Whip of Fangs / Alchemy: Potion of Mimicry).
Mimic: (1, 0% Lair). A shapeshifting dungeon predator that mimics furniture to catch the greedy.
Stats: 3d6 HP, Arm 1, Bite (d6). [Adhesive: Weapons striking it are stuck. Auto-hits grappled foes.]
Variants (d6): 1-3: Chest | 4-5: Weapon Rack | 6: Room Mimic (10d6 HP, entire floor adhesive).
Renderable: Adhesive (Crafting: Sovereign Glue / Alchemy: Potion of Windows).
Naga: (1-2, 75% Lair). Intelligent, serpent-bodied guardians protecting ancient vaults.
Stats: 4d6 HP, Arm 1, Bite (d6). [Spellcaster: Casts Tier 2 magic. Constrict: Grapples on hit.]
Variants (d6): 1-3: Water Naga | 4-5: Spirit Naga (Undead, Tier 3 Corruption) | 6: Guardian Naga (Tier 3 Illumination).
Renderable: Scale (Crafting: Circlet of the Mind / Alchemy: Potion of Tongues).
Ogre: (2-20, 20% Lair). Brute-force monstrosities that scavenge the hills, smashing anything that resists.
Stats: 4d6 HP, Arm 1, Greatclub (2d6). [Sweeping Blow: Hits two targets. Intimidation: -1 PRE to enemies.]
Variants (d6): 1-3: Standard | 4-5: Armored (Arm 2) | 6: Ogre Mage (6d6 HP, Tier 2 Illumination/Shadow).
Renderable: Marrow (Crafting: Belt of Giant Strength / Alchemy: Potion of Growth).
Ooze: (1-3, 0% Lair). Mindless, acidic protoplasm that dissolves all matter it touches.
Stats: 3d6 HP, Arm 0, Pseudopod (d6). [Corrosive: Destroys non-magical metal on hit.]
Variants (d6): 1-3: Gray Ooze | 4-5: Ochre Jelly (Dissolves wood) | 6: Gelatinous Cube (Invisible, paralyzes).
Renderable: Ooze Acid (Crafting: Acid Flask / Alchemy: Potion of Blackblood).
Owlbear: (2-5, 30% Lair). A fierce forest predator with the head of an owl and the body of a bear.
Stats: 4d6 HP, Arm 1, Claws/Beak (d6). [Frenzied Hug: Grapples and crushes for 2d6 dmg.]
Variants (d6): 1-3: Standard | 4-5: Snowy | 6: Screeching (Disadvantage to all within 30').
Renderable: Beak (Crafting: Pick of Rending / Alchemy: Potion of Heroism).
Rat (Giant): (5-50, 10% Lair). Voracious scavengers that thrive in the shadows, carrying filth and plague.
Stats: 1d6 HP, Arm 0, Bite (d6/d). [Swarm: Reduces target Armor. Disease: Test TOU or sickened.]
Variants (d6): 1-3: Standard | 4-5: Plague-bearer (Poison dmg) | 6: Rat-King (Casts Tier 1 Shadow).
Renderable: Tail (Crafting: Cloak of the Sewers / Alchemy: Potion of Silentstep).
Roper: (1-3, 90% Lair). A cave-ceiling predator that lowers sticky, rope-like tentacles to ensnare prey.
Stats: 4d6 HP, Arm 2, Tentacles (d6). [Reel In: Tentacle hits drag target 10'. Bite does 2d6 dmg to grappled foes.]
Variants (d6): 1-3: Standard | 4-5: Stony (Arm 3) | 6: Urophion (Electrical tentacles).
Renderable: Strand (Crafting: Rope of Climbing / Alchemy: Potion of Telekinesis).
Rust Monster: (1-2, 10% Lair). An insectoid scavenger that feeds exclusively on the iron of adventurers' gear.
Stats: 2d6 HP, Arm 1, Antennae (0). [Oxidation: Destroys metal items.]
Variants (d6): 1-3: Standard | 4-5: Armored | 6: Magic-eater (Consumes enchantments).
Renderable: Antennae (Crafting: Wand of Oxidation / Alchemy: Potion of Forget).
Scorpion (Giant): (1-4, 50% Lair). Heavily armored stalkers of the desert that deliver a paralyzing sting.
Stats: 3d6 HP, Arm 1, Claws/Sting (d6). [Sting: Auto-strikes if claw hits, Test TOU or 0 HP.]
Variants (d6): 1-3: Standard | 4-5: Cave Scorpion (Arm 2) | 6: Emperor (6d6 HP, Arm 3).
Renderable: Venom Gland (Crafting: Assassin's Dagger / Alchemy: Potion of Brutishness).
Shambling Mound: (1-3, 30% Lair). A sentient heap of rotting vegetation that constricts prey.
Stats: 4d6 HP, Arm 2, Slam (d6). [Lightning Absorption: Electrical attacks heal it. Constrict: Pinned targets take 2d6 dmg.]
Variants (d6): 1-3: Standard | 4-5: Spore-choked (Poison gas aura) | 6: Ancient (Roots control flora).
Renderable: Vine (Crafting: Armor of the Swamp / Alchemy: Potion of Barkskin).
Shark: (3-12, 0% Lair). The unthinking, razor-toothed masters of the deep who feed on anything that bleeds.
Stats: 3d6 HP, Arm 0, Bite (d6). [Blood Frenzy: Advantage against wounded targets.]
Variants (d6): 1-3: Standard | 4-5: Great White (5d6 HP) | 6: Megalodon (Swallows ships).
Renderable: Tooth (Crafting: Serrated Harpoon / Alchemy: Potion of Waterbreath).
Snake (Giant): (1-8, 0% Lair). Massive constrictors that rely on speed and crushing strength to secure their prey.
Stats: 3d6 HP, Arm 0, Bite (d6). [Constrict: d6 dmg/round. Poison: Test TOU or paralyzed.]
Variants (d6): 1-3: Poisonous | 4-5: Constrictor (4d6 HP) | 6: Spitting Cobra (Ranged poison).
Renderable: Scale (Crafting: Cloak of Slithering / Alchemy: Potion of Animalspeech).
Spider (Giant): (1-8, 70% Lair). Web-spinning nightmares that lurk in the canopy waiting for a trapped meal.
Stats: 3d6 HP, Arm 0, Bite (d6). [Web: Test STR to escape. Poison: Test TOU or paralyzed.]
Variants (d6): 1-3: Web-spinner | 4-5: Wolf Spider (Jumps 30') | 6: Phase Spider (Teleports at will).
Renderable: Spinneret (Crafting: Net of Entanglement / Alchemy: Potion of Invisibility).
Spôrshreek (Myconid): (2-8, 0% Lair). Fungal growths that release clouds of spores to signal nearby predators when disturbed.
Stats: 2d6 HP, Arm 0, Spores (d6). [Scream: Test PRE or draw monsters. Spore cloud: Test TOU or hallucinate.]
Variants (d6): 1-3: Standard | 4-5: Violet Fungus (Rotting tentacles) | 6: Shrieker King (Tier 2 Domination magic).
Renderable: Spore Sac (Crafting: Dust of Illusions / Alchemy: Potion of Plantspeech).
Stirge: (3-30, 60% Lair). Winged parasites that latch onto the neck and drain blood to fuel their thirst.
Stats: 1d6 HP, Arm 0, Proboscis (d6). [Blood Drain: Heals stirge. Auto-hits subsequent rounds.]
Variants (d6): 1-3: Standard | 4-5: Swarm (Counts as 1 entity) | 6: Dire Stirge (2d6 HP).
Renderable: Proboscis (Crafting: Syringe of Healing / Alchemy: Potion of Beastform).
Troll: (1-12, 40% Lair). Savage, hulking monstrosities that regenerate flesh until burned to ash.
Stats: 4d6 HP, Arm 1, Claws (d6). [Regeneration: Heals 1d6/round (Fire/Acid stops).]
Variants (d6): 1-3: Standard | 4-5: Cave Troll (Arm 2) | 6: Two-headed (Cannot be surprised).
Renderable: Blood (Crafting: Ring of Regeneration / Alchemy: Potion of Trollsblood).
Tyrannosaur: (1-2, 0% Lair). A massive, unthinking reptilian engine of pure hunger and teeth.
Stats: 6d6 HP, Arm 2, Bite (2d6). [Swallow: Auto-hit if grappled.]
Variants (d6): 1-3: Standard | 4-5: Armored Rex (Arm 3) | 6: Undead Rex (Necrotic breath).
Renderable: T-Rex Tooth (Crafting: Greatsword of Severing / Alchemy: Potion of Growth).
Vampire: (1-4, 25% Lair). Seductive, predatory undead who sustain their immortal life through blood.
Stats: 5d6 HP, Arm 1, Fangs (d6). [Drain: Drains stats/HP. Shapechange: Bat/Mist. Weakness: Sun/Water/Stake.]
Variants (d6): 1-3: Standard | 4-5: Lord (Casts Tier 3 Domination magic) | 6: Nosferatu (Arm 2, stealth advantage).
Renderable: Fang (Crafting: Amulet of the Bat / Alchemy: Potion of Trollsblood).
Wight: (2-16, 70% Lair). Malevolent spirits that inhabit the mummified remains of long-dead warriors.
Stats: 3d6 HP, Arm 1, Claws (d6). [Life Drain: Drains 1 STR or AGI on hit. Only harmed by magic/silver.]
Variants (d6): 1-3: Standard | 4-5: Barrow Wight (Rusted sword) | 6: Frost Wight (Cold dmg).
Renderable: Grave Dust (Crafting: Blade of the Wraith / Alchemy: Potion of Silentstep).
Wolf: (2-20, 10% Lair). Pack-hunting predators that shadow travelers to test for weakness.
Stats: 2d6 HP, Arm 0, Bite (d6). [Pack Tactics: Adv if teamed. Trip: Test AGI or knocked prone.]
Variants (d6): 1-3: Standard | 4-5: Dire Wolf (3d6 HP, Arm 1) | 6: Winter Wolf (Frost breath).
Renderable: Pelt (Crafting: Cloak of the Pack / Alchemy: Potion of Darksight).
Wyvern: (1-6, 30% Lair). A dragon-kin that strikes from the skies with a venomous tail barb.
Stats: 5d6 HP, Arm 1, Bite (d6)+Sting (d6). [Venom: Test TOU or 0 HP instantly.]
Variants (d6): 1-3: Standard | 4-5: Sand Wyvern (Sting is paralysis) | 6: Elder Wyvern (7d6 HP, Arm 2).
Renderable: Stinger (Crafting: Spear of Envenoming / Alchemy: Potion of Weaponskill).
Zombie: (3-24, 0% Lair). Thoughtless husks that shamble endlessly in search of living prey.
Stats: 2d6 HP, Arm 0, Bite (d6). [Relentless: 50% chance to stand at 0 HP. Shambling: Acts last.]
Variants (d6): 1-3: Standard | 4-5: Plague Zombie (Toxic gas aura) | 6: Hulk (4d6 HP, 2d6 dmg).
Renderable: Bile (Crafting: Flask of Noxious Gas / Alchemy: Potion of Blackblood).
II. HUMANOIDS & FAIRY FOLK
Brownie: (4-16, 20% Lair). Tiny, reclusive fae that repair items in exchange for kindness.
Stats: 1d6 HP, Arm 0, Dagger (d6/d). [Fae Agility: Disadvantage to spot. Teleport via shadows. Casts Tier 1 Illumination.]
Variants (d6): 1-3: Standard | 4-5: Boggart (Casts Confusion) | 6: Leprechaun (Tier 2 Illumination).
Dwarf: (40-400, 50% Lair). Squat, melancholy, and ill-mannered masters of stone and steel.
Stats: 2d6 HP, Arm 2, Axe (d6). [Resist: Immune to poison/magic.]
Variants (d6): 1-3: Standard | 4-5: Runesmith (Magical weapons) | 6: Thane (Tier 2 Illumination magic).
Elf: (20-200, 10% Lair). Pale, gaunt, and ancient dwellers of the deep woods.
Stats: 2d6 HP, Arm 1, Sword (d6). [Fey Grace: Disadvantage to hit with ranged. Immune to sleep.]
Variants (d6): 1-3: Wood Elf | 4-5: High Elf (Tier 1 Destruction) | 6: Shadow Elf (Poison weapons, Tier 2 Shadow).
Gnoll: (20-200, 20% Lair). Hyena-headed marauders who relish the chaos of the hunt.
Stats: 2d6 HP, Arm 1, Spear (d6). [Overwhelm: +1 dmg/ally. Track: Follows scents flawlessly.]
Variants (d6): 1-3: Standard | 4-5: Flind (uses flail) | 6: Demon-sworn (Tier 1 Blood magic).
Renderable: Hyena-gland (Crafting: Hunter's Salve / Alchemy: Potion of Frenzy).
Gnome: (40-400, 50% Lair). Curious, subterranean engineers who hoard mechanical secrets.
Stats: 2d6 HP, Arm 1, Warhammer (d6). [Tinker's Traps: 50% trap chance. Resist: Test INT vs magic.]
Variants (d6): 1-3: Standard | 4-5: Deep Gnome (Innate invisibility) | 6: Artificer (Uses mechanical constructs).
Renderable: Tinker's Core (Crafting: Clockwork Decoy / Alchemy: Potion of Perspective).
Goblin: (40-400, 40% Lair). Cowardly, quick-breeding vermin that plague civilization.
Stats: 1d6 HP, Arm 1, Dagger (d6/d). [Skitter: Disengage freely. Swarm: Adv if outnumbering.]
Variants (d6): 1-3: Standard | 4-5: Warg-rider (Mounted) | 6: Shaman (Tier 1 Destruction magic).
Renderable: Goblin Ear (Crafting: Amulet of the Coward / Alchemy: Potion of Darksight).
Halfling: (30-300, 70% Lair). Jovial, earth-dwelling folk who prioritize a warm hearth.
Stats: 1d6 HP, Arm 0, Sling (d6/d). [Lucky: Reroll test 1/day. Nimble: Hard to hit at range.]
Variants (d6): 1-3: Standard | 4-5: Stout (Uses axes) | 6: Burglar (Backstab dmg).
Renderable: Luckstone (Crafting: Ring of Evasion / Alchemy: Potion of Heroism).
Hobgoblin: (20-200, 25% Lair). Regimented goblinoids that view war as an art.
Stats: 2d6 HP, Arm 1, Sword (d6). [Shield Wall: Arm 2 if adjacent. Phalanx: Reach with spears.]
Variants (d6): 1-3: Standard | 4-5: Captain (Rallies troops) | 6: Warlord (High dmg).
Renderable: Iron Tusk (Crafting: Standard of Discipline / Alchemy: Potion of Ironskin).
Human: (Varies, Varies% Lair). Murderers, thieves, and saints, adaptable to any environment.
Stats: 2d6 HP, Arm 1, Sword (d6). [Adaptable: Rolls 3d6, take best 2 for Init.]
Variants (d6): 1-3: Bandit (Standard) | 4-5: Mercenary (3d6 HP, Arm 2) | 6: Sorcerer (Tier 3 magic).
Kobold: (40-400, 40% Lair). Vicious, trap-laying lizard-folk that worship dragons.
Stats: 1d6 HP, Arm 0, Dagger (d6/d). [Trap-setter: Traps inflict 2d6 dmg. Grovel: Can feign surrender.]
Variants (d6): 1-3: Standard | 4-5: Dragonshield (Arm 2) | 6: Sorcerer (Tier 1 Destruction).
Renderable: Draconic Scale (Crafting: Boots of Springing / Alchemy: Potion of Dragonscales).
Lizardman: (10-40, 30% Lair). Stoic swamp reptilians protecting their tribal grounds.
Stats: 2d6 HP, Arm 1, Club (d6). [Aquatic Ambush: Invisible submerged. Hold Breath: 10 mins.]
Variants (d6): 1-3: Standard | 4-5: Chameleon (Hidden, surprise) | 6: Shaman (Tier 2 Corruption magic).
Renderable: Reptile Gland (Crafting: Underwater Mask / Alchemy: Potion of Waterbreath).
Lycanthrope: (1-6, 15% Lair). Cursed mortals who lose humanity to the beast within.
Stats: 4d6 HP, Arm 1, Bite (d6). [Silver Weakness: Requires silver/magic. Curse: Bitten targets infected.]
Variants (d6): 1-2: Wererat | 3-4: Werewolf | 5: Wereboar (Arm 2) | 6: Werebear (2d6 dmg).
Renderable: Fang (Crafting: Silvered Weapon Rune / Alchemy: Potion of Beastform).
Orc: (30-300, 35% Lair). Aggressive, tusked warriors driven by a need for conquest.
Stats: 2d6 HP, Arm 1, Sword (d6). [Bloodlust: Final attack at 0 HP. Horde: Morale immunity.]
Variants (d6): 1-3: Standard | 4-5: Berserker (2 attacks) | 6: Chieftain (Arm 2, 2d6 dmg).
Renderable: Tusk (Crafting: Helmet of the Horde / Alchemy: Potion of Brutishness).
Serpent Folk: (1-6, 20% Lair). Ancient masters of magic who remember the world before man.
Stats: 3d6 HP, Arm 1, Trident (d6). [Mesmerize: Test INT or stunned. Toxic Blood: Melee attackers take 1 acid dmg.]
Variants (d6): 1-3: Warrior | 4-5: Priest (Tier 3 Domination magic) | 6: Abomination (Constricts).
Renderable: Serpent Eye (Crafting: Medallion of Thought Shield / Alchemy: Potion of Tongues).
Skaven: (20-200, 20% Lair). Corrupt rat-folk dwelling in cities beneath the world.
Stats: 1d6 HP, Arm 1, Dagger (d6/d). [Swarm: +1 to hit if teamed. Warp-bomb: 1-in-6 carry bomb (10' radius).]
Variants (d6): 1-3: Clanrat | 4-5: Stormvermin (Halberd) | 6: Grey Seer (Tier 2 Shadow magic).
Renderable: Warp-stone Shard (Crafting: Warp-blade / Alchemy: Potion of Blasphemy).`;

const monsters = [];
let currentMonster = null;

const lines = text.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('II.')) continue;

    const match = line.match(/^([^:]+):\s*\(([^,]+),\s*([^%]+)%\s*Lair\)\.\s*(.*)/);
    if (match) {
        if (currentMonster) {
            monsters.push(currentMonster);
        }
        
        let name = match[1].trim();
        const num = match[2].trim();
        const lair = match[3].trim() + "%";
        let desc = match[4].trim();

        // Specific fix for names like "Rat (Giant)" -> "RatGiant"
        let idName = name.replace(/\s+/g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/-/g, '');

        currentMonster = {
            name: name,
            idName: idName,
            num: num,
            lair: lair,
            desc: desc,
            stats: "",
            variants: "",
            renderable: ""
        };
    } else if (line.startsWith("Stats:")) {
        if (currentMonster) currentMonster.stats = line.substring(6).trim();
    } else if (line.startsWith("Variants (d6):")) {
        if (currentMonster) currentMonster.variants = line.substring(14).trim();
    } else if (line.startsWith("Renderable:")) {
        if (currentMonster) currentMonster.renderable = line.substring(11).trim();
    } else {
        if (currentMonster && !currentMonster.stats) {
            currentMonster.desc += " " + line;
        }
    }
}

if (currentMonster) {
    monsters.push(currentMonster);
}

const outputTables = [];

const monsterNames = monsters.map(m => m.name);
outputTables.push({
    id: "tbl_main",
    name: "Encounter (Monster)",
    command: "!Monster",
    group: "Encounters",
    rows: monsterNames.join('\n'),
    enabled: true,
    subRolls: [
        { label: "Info", formula: "!{Result}Info" },
        { label: "Lair", formula: "!{Result}Lair" },
        { label: "Num", formula: "!{Result}Num" },
        { label: "Variant", formula: "!{Result}Variants" },
        { label: "Harvest", formula: "!{Result}Harvest" }
    ]
});

function parseVariants(varStr) {
    if (!varStr) return "Standard\nStandard\nStandard\nStandard\nStandard\nStandard";
    const parts = varStr.split('|');
    const rows = new Array(6).fill(null);
    
    for (const p of parts) {
        const str = p.trim();
        const m = str.match(/^(\d+)-?(\d+)?:\s*(.*)/);
        if (m) {
            const start = parseInt(m[1], 10);
            const end = m[2] ? parseInt(m[2], 10) : start;
            const text = m[3];
            for (let j = start - 1; j < end; j++) {
                if (j < 6) rows[j] = text;
            }
        }
    }
    
    for (let j = 0; j < 6; j++) {
        if (rows[j] === null) rows[j] = "Standard";
    }
    
    return rows.join('\n');
}

for (const m of monsters) {
    const group = "Monsters: " + m.name;
    
    outputTables.push({
        id: "tbl_" + m.idName + "_info",
        name: m.name + " Info",
        group: group,
        command: "!" + m.idName + "Info",
        rows: m.desc + " Stats: " + m.stats,
        enabled: true,
        subRolls: []
    });
    
    outputTables.push({
        id: "tbl_" + m.idName + "_lair",
        name: m.name + " Lair",
        group: group,
        command: "!" + m.idName + "Lair",
        rows: m.lair,
        enabled: true,
        subRolls: []
    });
    
    outputTables.push({
        id: "tbl_" + m.idName + "_num",
        name: m.name + " Num",
        group: group,
        command: "!" + m.idName + "Num",
        rows: m.num,
        enabled: true,
        subRolls: []
    });
    
    outputTables.push({
        id: "tbl_" + m.idName + "_var",
        name: m.name + " Variants",
        group: group,
        command: "!" + m.idName + "Variants",
        rows: parseVariants(m.variants),
        enabled: true,
        subRolls: []
    });
    
    outputTables.push({
        id: "tbl_" + m.idName + "_harv",
        name: m.name + " Harvest",
        group: group,
        command: "!" + m.idName + "Harvest",
        rows: m.renderable ? m.renderable : "[No harvestable materials]",
        enabled: true,
        subRolls: []
    });
}

fs.writeFileSync('tables.json', JSON.stringify(outputTables, null, 2));
console.log('Successfully generated tables.json');
