# ATON Merkhet plugin

![alt text](./public/merkhet.jpg)

This flare (plugin) allows to track and generate records about users' sessions in ATON 3D scenes. Requires url parameter `mk.freq=<msec>` to start tracking with given time interval (milliseconds), e.g.: `?mk.freq=300`
Records are generated and stored as CSV records on deployment node (server-side) inside the "records/" folder.


## Getting started

1) Follow [ATON framework instructions](https://github.com/phoenixbf/aton)
2) Just git clone or place "merkhet" folder inside `/Your-ATON-folder/config/flares/` thus obtaining: `/Your-ATON-folder/config/flares/merkhet/`
3) When loading a 3D scene with Hathor, it starts tracking and generating records