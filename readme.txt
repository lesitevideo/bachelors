A- découverte de threejs : https://threejs.org/docs/#manual/en/introduction/Creating-a-scene
1. Copiez three.js sur votre ordi, dans un dossier de travail : https://threejs.org/build/three.js
2. https://threejs.org/docs/#manual/en/introduction/Creating-a-scene

B- threejs en front, nodejs en back
0. pré-requis : installez nodejs sur votre ordi => https://nodejs.org/en/
1. Telechargez le contenu du dossier trailblazer dans votre dossier de travail local
2. Installez les dépendances => npm install
3. lancez le jeu => node index.js
4. ouvrez vote browser et allez à l'adresse : http://localhost:3000/

Pour jouer, soit vous jouez à deux sur un seul clavier (P1 = arrow keys, P2 = touches 1,3,5), soit :
- l'ordi qui fait tourner l'instance nodejs communique son IP à deux joueurs
- les deux joueurs (sur le même réseau wifi évidemment) se rendent sur l'IP de l'ordi serveur : http://xxx.xxx.xxx.xxx:3000 pour afficher les gamepads
nb : si vous connectez vos smartphones au reseau wifi, vous pourrez jouer avec les smartphones

Dans un premier temps, nous allons bosser sur Threescene.html pour découvrir Threejs et bien comprendre comment construire une scene 3D dans le browser.
Ensuite, nous allons tâcher de comprendre comment fonctionne le jeu : un affichage en webgl, un gamepad, des sockets
