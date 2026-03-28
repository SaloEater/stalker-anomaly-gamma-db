# S.T.A.L.K.E.R. Anomaly Save File Format

Reverse-engineered from `xray-monolith` source code and binary analysis of Anomaly/GAMMA save files.

Source: [xray-monolith](https://github.com/themrdemonized/xray-monolith)

## Overview

Anomaly save games consist of two files per save slot:

| File | Extension | Contents |
|------|-----------|----------|
| Server objects (alife) | `.scop` | All world objects: NPCs, items, anomalies, smart terrains, the player actor, inventory contents, etc. Serialized via C++ `NET_Packet` and LZO1X compressed. |
| Script state (common) | `.scoc` | Lua script module state. Serialized via Lua `marshal` (binary Lua tables). Uncompressed. |

Both files share the same base name, e.g. `tak - quicksave_5.scop` / `tak - quicksave_5.scoc`.

---

## `.scop` File Format (Server Objects)

### Top-Level Structure

```
Offset  Size  Field
0       4     u32   marker         = 0xFFFFFFFF
4       4     u32   ALIFE_VERSION  = 6
8       4     u32   source_count   (uncompressed data size in bytes)
12      ...   u8[]  LZO1X compressed data
```

The compressed payload is a single LZO1X block. Decompress with `lzo1x_decompress` to get `source_count` bytes.

**Source:** `alife_storage_manager.cpp` lines 80-106.

### Decompressed Data (IWriter Chunk Stream)

The decompressed data is a sequence of IWriter chunks. Each chunk has:

```
Offset  Size  Field
0       4     u32   chunk_id   (bit 31 = CFS_CompressMark = LZHUF-compressed content)
4       4     u32   chunk_size
8       ...   u8[]  chunk data (chunk_size bytes)
```

The chunks in order are:

| Chunk ID | Writer | Contents |
|----------|--------|----------|
| 0 | `alife_simulator_header` | u32 version, time data |
| 5 | `alife_time_manager` | Game time (16 bytes) |
| 1 | `alife_spawn_registry` | Spawn point data |
| 2 | `alife_object_registry` | **All alife objects (the main data)** |
| 9 | `alife_registry_container` | Script-driven registries (relations, infoportions, etc.) |

**Source:** `alife_storage_manager.cpp` lines 84-89 (save order).

### Object Registry (Chunk ID 2)

Contains all server entities in the game world.

```
Offset  Size  Field
0       4     u32   object_count (total objects including children)
4       ...   object_entry[] (repeated object_count times)
```

Each `object_entry` is a **spawn packet** followed by an **update packet**:

```
u16   spawn_packet_size
u8[]  spawn_packet_data  (spawn_packet_size bytes)
u16   update_packet_size
u8[]  update_packet_data (update_packet_size bytes)
```

Objects are written **recursively**: each root object (ID_Parent == 0xFFFF) is followed immediately by its children, then their children, etc. The flat `object_count` includes all objects at all nesting levels. On load, the engine reads them sequentially without needing to track nesting.

**Source:** `alife_object_registry.cpp` lines 29-94.

### Spawn Packet Format

The spawn packet is a `NET_Packet` written by `CSE_Abstract::Spawn_Write`. It begins with a 2-byte message type header, then the object's serialized spawn state.

```
Offset  Size  Type     Field
0       2     u16      M_SPAWN (= 1, message type from w_begin)
2       ?     stringZ  section_name (null-terminated, e.g. "wpn_ak74", "actor")
?       ?     stringZ  name_replace (null-terminated, often empty "")
?       1     u8       legacy_gameid (always 0)
?       1     u8       s_RP (respawn point, 0xFE = use supplied coords)
?       12    vec3     o_Position (3x float32, world coordinates)
?       12    vec3     o_Angle (3x float32, orientation)
?       2     u16      RespawnTime
?       2     u16      ID (object's unique game ID)
?       2     u16      ID_Parent (0xFFFF = no parent / on ground)
?       2     u16      ID_Phantom
?       2     u16      s_flags (includes M_SPAWN_VERSION bit)
?       2     u16      SPAWN_VERSION (m_wVersion, currently 128)
?       2     u16      m_gameType
?       2     u16      script_server_object_version
?       2     u16      client_data_size
?       ?     u8[]     client_data (client_data_size bytes, often 0)
?       2     u16      m_tSpawnID
?       2     u16      state_size (size of the following STATE_Write block)
?       ?     u8[]     STATE_Write data (state_size bytes, class-specific)
```

**Source:** `xrServer_Object_Base.cpp` lines 198-257 (`Spawn_Write`), 275-373 (`Spawn_Read`).

#### Key Fields

- **`section_name`**: The game config section (e.g. `wpn_ak74`, `ammo_5.45x39_fmj`, `novice_outfit`). Determines the object's class and properties.
- **`ID`**: Unique 16-bit object identifier (0-65534). Actor is always ID 0.
- **`ID_Parent`**: If `0xFFFF`, the object is a root (on the ground, in the world). Otherwise, it's the ID of the containing object (e.g. an NPC or the actor). **Items in the actor's inventory have `ID_Parent = 0`** (the actor's ID).
- **`SPAWN_VERSION`** (m_wVersion): Controls which fields are present in STATE_Read. Current version is 128.

### Update Packet Format

The update packet is written by `CSE_Abstract::save_update` / `UPDATE_Write`:

```
Offset  Size  Type     Field
0       2     u16      M_UPDATE (= 0, message type from w_begin)
2       ...   u8[]     Class-specific update data (varies by object type)
```

Update packets are typically small or empty for static objects.

### STATE_Write Data (Class Hierarchy)

The `state_size` bytes after the spawn header contain class-specific data, written by the inheritance chain's `STATE_Write` methods. Each derived class calls its parent first, then writes its own fields.

#### CSE_ALifeObject (base for all alife entities)

```
Offset  Size  Type     Field
0       2     u16      m_tGraphID (game graph vertex)
2       4     float    m_fDistance
6       4     u32      m_bDirectControl
10      4     u32      m_tNodeID (level vertex ID)
14      4     u32      m_flags
18      ?     stringZ  m_ini_string (custom spawn data, often large)
?       4     u32      m_story_id (0xFFFFFFFF = none)
?       4     u32      m_spawn_story_id (0xFFFFFFFF = none)
```

**Source:** `xrServer_Objects_ALife.cpp` lines 427-437.

#### CSE_ALifeDynamicObjectVisual (visual model)

Adds after CSE_ALifeObject via `visual_write`:

```
Offset  Size  Type     Field
0       ?     stringZ  visual_name (model path, e.g. "dynamics\weapons\wpn_sks\wpn_sks")
?       1     u8       visual_flags
```

**Source:** `xrServer_Objects_Abstract.cpp` lines 57-61 (`visual_write`).

#### CSE_ALifeInventoryItem (items that can be in inventory)

Adds after CSE_ALifeDynamicObjectVisual:

```
Offset  Size  Type     Field
0       4     float    m_fCondition (0.0-1.0, item durability)
4       4     u32      upgrade_count
8       ?     stringZ[] upgrades (upgrade_count null-terminated strings)
```

**Note:** Slot information is NOT serialized in the `.scop` file. The item's slot is determined at runtime from the section config. However, the `.scoc` file's `beltMemory` table tracks which artifacts are equipped in belt slots (see below).

**Source:** `xrServer_Objects_ALife_Items.cpp` lines 87-92.

#### CSE_ALifeItemWeapon (weapons)

Adds after CSE_ALifeItem (which chains CSE_ALifeDynamicObjectVisual + CSE_ALifeInventoryItem):

```
Offset  Size  Type     Field
0       2     u16      a_current (ammo in current magazine)
2       2     u16      a_elapsed (total ammo)
4       1     u8       wpn_state
5       1     u8       m_addon_flags (scope, silencer, grenade launcher bits)
6       1     u8       ammo_type (index into ammo type list)
7       1     u8       a_elapsed_grenades (packed: type<<6 | count)
```

**Source:** `xrServer_Objects_ALife_Items.cpp` lines 583-592.

#### Weapon Addon Suffixes

When a weapon has an addon (scope, silencer, grenade launcher) attached, the game may store the combined section name:

```
wpn_sks_b_wpn_addon_scope_pu    →  base weapon: wpn_sks_b
wpn_mosin_wpn_addon_scope_pu    →  base weapon: wpn_mosin
```

The suffix `_wpn_addon_<addon_section>` is appended to the weapon's base section name. Strip it to resolve the base weapon ID.

#### Ammo Type Resolution

The `ammo_type` field in CSE_ALifeItemWeapon is an index into the weapon's ammo type list from its `.ltx` config. For example, if a weapon's config has `ammo_class = ammo_7.62x25_p, ammo_7.62x25_ps`, then `ammo_type = 1` means `ammo_7.62x25_ps` is loaded.

### Inventory / Loadout Determination

The `.scop` file does NOT store explicit slot assignments. To determine what's equipped vs. in backpack:

1. **Parent-child relationship**: Items with `ID_Parent == <actor_id>` (typically 0) are in the actor's inventory.
2. **Slot from config**: Each item's slot is defined in its `.ltx` config section (e.g. `slot = 2` for primary weapon).
3. **Active slot**: Stored in the `.scoc` file under `game_object[0].actor_binder.active_slot`.
4. **Equipped artifacts**: The `.scoc` file's `beltMemory` table tracks which artifacts are in belt slots (see below).

Active slot values: `0` = knife, `1` = pistol, `2` = primary weapon, `3` = secondary weapon, `4` = grenade, `5` = binoculars, `7` = detector, `12` = outfit, `13` = helmet.

Items in an NPC's inventory have `ID_Parent` set to that NPC's object ID.

### Player Stash

The player's personal stash is stored as a container object with section name `workshop_stash`. Items in the stash have `ID_Parent` set to the workshop_stash object's ID.

---

## `.scoc` File Format (Lua Script State)

### Structure

The `.scoc` file uses Lua `marshal` binary serialization. It is **not compressed**.

```
Offset  Size  Field
0       1     u8    marker (0x8E)
1       ...   TABLE root table (the entire file is one marshalled Lua table)
```

### Marshal Type Tags

| Tag | Type | Payload |
|-----|------|---------|
| `0x00` | nil | (none) |
| `0x01` | boolean | 1 byte (0 = false, 1 = true) |
| `0x03` | number | 8 bytes (float64 little-endian) |
| `0x04` | string | u32 LE length + raw bytes (NOT null-terminated) |
| `0x05` | table | u8 subtype + u32 LE data_size + nested key-value pairs |

Tables contain alternating key-value pairs (each a tagged value). The `data_size` field gives the byte length of all nested content, allowing fast skipping.

### Top-Level Keys

The root table is a flat dictionary where each key is a Lua script module's save identifier. Notable keys:

| Key | Description |
|-----|-------------|
| `game_object` | Per-entity script state, keyed by game ID. `game_object[0]` = actor. |
| `se_object` | Per-entity extra Lua data (names, healing flags, etc.) |
| `item_remaining_uses` | Table of `{item_id: uses_count}` pairs |
| `item_condition` | Table of `{item_id: condition_float}` pairs |
| `device_condition` | Condition values for devices |
| `mags_storage` | Magazine system data (section names, loaded ammo) |
| `beltMemory` | Artifact belt slot data (see below) |
| `world_itm_on` | Items placed in world stashes (item_id -> stash_name) |
| `trade_manager` | Trader inventory states |
| `treasure_manager` | Stash/treasure data |
| `game_statistics` | Play statistics |
| `task_info` | Active quest state |
| `SurgeManager` / `PsiStormManager` | Emission/storm state |

#### Actor-Specific Data (`game_object[0]`)

```json
{
  "name": "actor",
  "actor_binder": {
    "active_slot": 0.0,
    "character_icon": "ui_inGame2_neutral_1_gas",
    "game_difficulty": 2.0,
    "simulation_started": true
  },
  "pstor_all": {
    "health.head": 11.0,
    "health.torso": 11.0,
    "...": "..."
  },
  "xr_sound": { "...": "..." }
}
```

#### Belt Memory (`beltMemory`)

Tracks which artifacts are equipped in belt slots, keyed by outfit object ID:

```json
{
  "22826": {
    "date": 43462.1,
    "items": {
      "14279": true
    }
  }
}
```

- The outer key (`22826`) is the **outfit object ID** (from `.scop`).
- `items` maps **artifact object IDs** to `true` for each artifact currently in a belt slot.
- An artifact in the actor's inventory (`ID_Parent == 0` in `.scop`) that also appears in `beltMemory.items` is equipped; otherwise it's carried in the backpack.

### Translation Encoding

Source translation CSVs (`en_us.csv`, `ru_ru.csv`) use Windows-1251 encoding. The generation script decodes them automatically.

---

## Compression Details

### LZO1X (Primary - Save Files)

Used for the `.scop` outer wrapper. The entire decompressed payload is one LZO1X block.

- **Compress:** `lzo1x_1_compress` (from `rt_compressor.cpp`)
- **Decompress:** `lzo1x_decompress`
- **Python:** `lzallright.LZOCompressor().decompress(data, uncompressed_size)`

### LZHUF (Secondary - Individual Chunks)

Used for individually compressed chunks (indicated by `CFS_CompressMark`, bit 31 of chunk ID). LZSS + Adaptive Huffman coding.

- Format: First 4 bytes of compressed data = u32 uncompressed_size, then compressed stream
- **Source:** `LzHuf.cpp`
- **Marker:** `CFS_CompressMark = 1 << 31` (0x80000000) in chunk ID

---

## Parsing Example (Python)

```python
import struct
import lzallright

# Decompress .scop
with open("save.scop", "rb") as f:
    raw = f.read()

marker, version, uncompressed_size = struct.unpack_from("<III", raw, 0)
assert marker == 0xFFFFFFFF
assert version == 6

compressed = raw[12:]
decompressed = lzallright.LZOCompressor().decompress(compressed, uncompressed_size)

# Find object registry (chunk ID 2)
pos = 0
while pos + 8 <= len(decompressed):
    chunk_id = struct.unpack_from("<I", decompressed, pos)[0]
    chunk_size = struct.unpack_from("<I", decompressed, pos + 4)[0]
    if (chunk_id & 0x7FFFFFFF) == 2:
        obj_registry = decompressed[pos + 8 : pos + 8 + chunk_size]
        break
    pos += 8 + chunk_size

# Parse objects
count = struct.unpack_from("<I", obj_registry, 0)[0]
pos = 4
for i in range(count):
    # Spawn packet
    spawn_size = struct.unpack_from("<H", obj_registry, pos)[0]; pos += 2
    spawn_data = obj_registry[pos : pos + spawn_size]; pos += spawn_size

    # Update packet
    update_size = struct.unpack_from("<H", obj_registry, pos)[0]; pos += 2
    pos += update_size

    # Parse spawn: skip u16 M_SPAWN, read section name
    sp = 2
    null = spawn_data.find(b"\x00", sp)
    section = spawn_data[sp:null].decode("ascii")

    # Skip name, legacy, s_RP, position(12), direction(12)
    sp = spawn_data.find(b"\x00", null + 1) + 1 + 2 + 24

    # Read ID fields
    obj_id = struct.unpack_from("<H", spawn_data, sp + 2)[0]
    parent_id = struct.unpack_from("<H", spawn_data, sp + 4)[0]

    if parent_id == 0:  # In actor's inventory
        print(f"  {section} (ID={obj_id})")
```

---

## Constants

| Name | Value | Description |
|------|-------|-------------|
| `ALIFE_VERSION` | 6 | Save format version |
| `SPAWN_VERSION` | 128 | Current object serialization version (m_wVersion) |
| `M_SPAWN` | 1 | NET_Packet message type for spawn data |
| `M_UPDATE` | 0 | NET_Packet message type for update data |
| `CFS_CompressMark` | 0x80000000 | Bit flag in chunk ID indicating LZHUF compression |
| `OBJECT_CHUNK_DATA` | 2 | Chunk ID for the object registry |

## Source Files Reference

| File | Contents |
|------|----------|
| `alife_storage_manager.cpp` | Top-level save/load, LZO compression |
| `alife_object_registry.cpp` | Object registry save (recursive children) and load |
| `xrServer_Object_Base.cpp` | `CSE_Abstract::Spawn_Write/Read` — spawn packet format |
| `xrServer_Objects_ALife.cpp` | `CSE_ALifeObject`, `CSE_ALifeDynamicObjectVisual` STATE_Write/Read |
| `xrServer_Objects_Abstract.cpp` | `CSE_Visual::visual_write/visual_read` — visual name + flags |
| `xrServer_Objects_ALife_Items.cpp` | Item, weapon, outfit STATE_Write/Read |
| `xrServer_Objects_ALife_Monsters.cpp` | Actor, creature STATE_Write/Read |
| `rt_compressor.cpp` | LZO1X compress/decompress wrappers |
| `LzHuf.cpp` | LZHUF compress/decompress |
| `FS.h` / `FS.cpp` | IWriter/IReader chunk format, CFS_CompressMark |
| `xrMessages.h` | M_SPAWN, M_UPDATE enum values |
