# 3D Lightsaber Project

A 3D interactive lightsaber simulation built with Three.js and GLSL (Shader), utilizing Vite as the development environment.

## Installation
To set up the development environment, you need to install [Node.js](https://nodejs.org/ja/).
To share and build this project, execute following commands:

```bash
# 1. Clone the repository (or pull if already cloned)
git clone <repository-url>
cd ACG_group_work

# 2. Install dependencies based on package.json
npm install

# 3. activate the development server for page preview
npm run dev
```

To import new library, install it with following command
What you installed will be reflected to package.json
We will install same one using "npm install" after "git pull"
```bash
npm install three
```


## Structure
* **src/main.js** 
    * executed first of all
* **src/core/App.js**
    * control and integrate classes we edit, like physics, scenes and ui
    * some function or data transform which require to be done in every frame should be here. (for this reason, some ui like FPS indicator is processed here)
* **src/physics**
    * calc how the objects move.  ex. pos, angle, speed
    * calculation like collision judge also would be done here
* **src/scenes**
    * **components** Contains .js files defining 3D objects.
    * **shaders** `#version 300 es` glsl shaders
        * Defines the algorithm for object appearance (visuals).
        * Note: Depending on the setup, explicit version definitions or input declarations might be handled automatically.
* **src/ui**
    * user interface using `lil-gui` 
    * Most UI-related logic resides here, interacting with App.js when necessary.

* **public**
    * Static assets accessible from any file.
    * we can add icons, config file, stuff like that (Currently unused).
* **others**
    * we can change or add this prototype depending on what we need
