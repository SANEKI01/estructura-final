// game.js - VERSION CON GRAFOS IMPLEMENTADOS (CORREGIDO)

// ============================================================================
// CONFIGURACIÓN DEL JUEGO
// ============================================================================
const CONFIG = {
    CANVAS_WIDTH: 640,
    CANVAS_HEIGHT: 480,
    TILE_SIZE: 32,
    PLAYER_SPEED: 4,
    NPC_SPEED: 1,
    INTERACTION_DISTANCE: 60,
    TRANSITION_THRESHOLD: 10,
    TORTA_CULPABLE: "ÁNGEL"
};

// ============================================================================
// ESTRUCTURAS DE DATOS
// ============================================================================

// 1. GRAFOS
class GraphNode {
    constructor(id, data) {
        this.id = id;
        this.data = data;
        this.adjacent = new Map();
    }
    
    addAdjacent(node, weight = 1) {
        this.adjacent.set(node.id, { node, weight });
    }
    
    removeAdjacent(nodeId) {
        return this.adjacent.delete(nodeId);
    }
    
    isAdjacent(nodeId) {
        return this.adjacent.has(nodeId);
    }
    
    getAdjacents() {
        return Array.from(this.adjacent.values());
    }
}

class CharacterGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
    }
    
    addNode(id, data) {
        if (!this.nodes.has(id)) {
            const node = new GraphNode(id, data);
            this.nodes.set(id, node);
            return node;
        }
        return this.nodes.get(id);
    }
    
    addEdge(sourceId, targetId, weight = 1, bidirectional = false) {
        const source = this.nodes.get(sourceId);
        const target = this.nodes.get(targetId);
        
        if (!source || !target) {
            console.error("Nodos no encontrados:", sourceId, targetId);
            return;
        }
        
        source.addAdjacent(target, weight);
        this.edges.push({ source: sourceId, target: targetId, weight });
        
        if (bidirectional) {
            target.addAdjacent(source, weight);
            this.edges.push({ source: targetId, target: sourceId, weight });
        }
    }
    
    getNode(id) {
        return this.nodes.get(id);
    }
    
    getAllNodes() {
        return Array.from(this.nodes.values());
    }
    
    getAllEdges() {
        return this.edges;
    }
    
    // Búsqueda en profundidad (DFS)
    dfs(startId, visited = new Set()) {
        const startNode = this.getNode(startId);
        if (!startNode) return [];
        
        visited.add(startId);
        const result = [startNode];
        
        for (const { node } of startNode.getAdjacents()) {
            if (!visited.has(node.id)) {
                result.push(...this.dfs(node.id, visited));
            }
        }
        
        return result;
    }
    
    // Búsqueda en anchura (BFS)
    bfs(startId) {
        const startNode = this.getNode(startId);
        if (!startNode) return [];
        
        const visited = new Set([startId]);
        const queue = [startNode];
        const result = [];
        
        while (queue.length > 0) {
            const node = queue.shift();
            result.push(node);
            
            for (const { node: adjNode } of node.getAdjacents()) {
                if (!visited.has(adjNode.id)) {
                    visited.add(adjNode.id);
                    queue.push(adjNode);
                }
            }
        }
        
        return result;
    }
    
    // Encontrar el nodo más sospechoso
    findMostSuspicious() {
        let maxConnections = -1;
        let suspiciousNode = null;
        
        for (const node of this.getAllNodes()) {
            if (node.id === "PAPÁ") continue; // Excluir al investigador
            
            const connectionCount = node.getAdjacents().length;
            if (connectionCount > maxConnections) {
                maxConnections = connectionCount;
                suspiciousNode = node;
            }
        }
        
        return suspiciousNode;
    }
}

// 2. ÁRBOL BINARIO
class TreeNode {
    constructor(value, left = null, right = null) {
        this.value = value;
        this.left = left;
        this.right = right;
    }
}

class InvestigationTree {
    constructor() {
        this.root = new TreeNode({
            npcName: "INVESTIGACION",
            clue: "Torta desaparecida de la cocina",
            isCulprit: false
        });
        
        this.buildTree();
        this.currentNode = this.root;
        this.decisionPath = [];
    }
    
    buildTree() {
        const angelCulpable = new TreeNode({
            npcName: "ÁNGEL",
            clue: "Confesión: Tenía hambre después del entrenamiento",
            isCulprit: true
        });
        
        const marielInocente = new TreeNode({
            npcName: "MARIEL",
            clue: "Alibi: Grabando TikTok toda la noche",
            isCulprit: false
        });
        
        const mamaInocente = new TreeNode({
            npcName: "MAMÁ",
            clue: "Alibi: Dormía profundamente (ronquidos confirmados)",
            isCulprit: false
        });
        
        const leiaInocente = new TreeNode({
            npcName: "LEIA",
            clue: "Imposible: No puede abrir la nevera",
            isCulprit: false
        });
        
        const marielNode = new TreeNode({
            npcName: "MARIEL",
            clue: "Vista cerca de la cocina - Sospechosa",
            isCulprit: false
        }, marielInocente, angelCulpable);
        
        const angelNode = new TreeNode({
            npcName: "ÁNGEL",
            clue: "Sin alibi - Alto nivel de sospecha",
            isCulprit: false
        }, angelCulpable, mamaInocente);
        
        const leiaNode = new TreeNode({
            npcName: "LEIA",
            clue: "Olfateó la cocina - Sospechosa",
            isCulprit: false
        }, leiaInocente, angelCulpable);
        
        const mamaNode = new TreeNode({
            npcName: "MAMÁ",
            clue: "Cocinera - Oportunidad y conocimiento",
            isCulprit: false
        }, marielNode, leiaNode);
        
        this.root.left = mamaNode;
        this.root.right = leiaNode;
    }
    
    investigate(decision) {
        this.decisionPath.push({
            node: this.currentNode.value,
            decision: decision ? "SÍ" : "NO"
        });
        
        if (decision && this.currentNode.left) {
            this.currentNode = this.currentNode.left;
        } else if (!decision && this.currentNode.right) {
            this.currentNode = this.currentNode.right;
        }
        
        return this.currentNode.value;
    }
    
    getSolution() {
        const stack = [this.root];
        let culprit = null;
        
        while (stack.length > 0) {
            const node = stack.pop();
            
            if (node.value.isCulprit) {
                culprit = node.value;
                break;
            }
            
            if (node.right) stack.push(node.right);
            if (node.left) stack.push(node.left);
        }
        
        return culprit;
    }
}

// 3. LISTAS ENLAZADAS
class ListNode {
    constructor(data) {
        this.data = data;
        this.next = null;
        this.prev = null;
    }
}

class ConversationHistory {
    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
        this.maxSize = 50;
    }
    
    addConversation(speaker, message) {
        const newNode = new ListNode({
            speaker,
            message,
            timestamp: new Date()
        });
        
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            this.tail.next = newNode;
            newNode.prev = this.tail;
            this.tail = newNode;
        }
        
        this.size++;
        
        if (this.size > this.maxSize) {
            this.removeOldest();
        }
        
        return newNode;
    }
    
    removeOldest() {
        if (!this.head) return null;
        
        const removed = this.head;
        this.head = this.head.next;
        
        if (this.head) {
            this.head.prev = null;
        } else {
            this.tail = null;
        }
        
        this.size--;
        return removed.data;
    }
    
    findClues(keywords) {
        const clues = [];
        let current = this.head;
        
        while (current) {
            const message = current.data.message.toLowerCase();
            if (keywords.some(keyword => message.includes(keyword.toLowerCase()))) {
                clues.push(current.data);
            }
            current = current.next;
        }
        
        return clues;
    }
}

// 4. PILAS
class DialogStack {
    constructor() {
        this.items = [];
    }
    
    push(item) {
        this.items.push(item);
    }
    
    pop() {
        if (this.isEmpty()) return null;
        return this.items.pop();
    }
    
    peek() {
        if (this.isEmpty()) return null;
        return this.items[this.items.length - 1];
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
    
    clear() {
        this.items = [];
    }
}

// 5. COLAS
class AnimationQueue {
    constructor() {
        this.items = [];
    }
    
    enqueue(item) {
        this.items.push(item);
    }
    
    dequeue() {
        if (this.isEmpty()) return null;
        return this.items.shift();
    }
    
    front() {
        if (this.isEmpty()) return null;
        return this.items[0];
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
    
    clear() {
        this.items = [];
    }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

// Instanciar estructuras de datos
const investigationTree = new InvestigationTree();
const conversationHistory = new ConversationHistory();
const dialogStack = new DialogStack();
const animationQueue = new AnimationQueue();
const characterGraph = new CharacterGraph();

// Variables del juego
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Referencias a elementos del DOM
const roomNameElement = document.getElementById('room-name');
const dialogTextElement = document.getElementById('dialog-text');
const dialogOptionsElement = document.getElementById('dialog-options');
const charactersPresentElement = document.getElementById('characters-present');
const dialogueStatusElement = document.getElementById('dialogue-status');
const gameHintElement = document.getElementById('game-hint');
const cluesCountElement = document.getElementById('clues-count');

// Variables de estado
let currentRoom = null;
let player = null;
let npcs = [];
let inDialogue = false;
let activeNPC = null;
let lastTime = 0;
const keys = {};
let isTransitioning = false;
let playerCanMove = true;
let gameInitialized = false;
let collectedClues = [];
let accusationMade = false;

// URLs de imágenes
const CHARACTER_IMAGES = {
    papa: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Papa&backgroundColor=4dabf7',
    mama: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Mama&backgroundColor=ff6b6b',
    mariel: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Mariel&backgroundColor=cc5de8',
    angel: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Angel&backgroundColor=51cf66',
    leia: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Leia&backgroundColor=ff922b'
};

// Caché de imágenes
const imageCache = new Map();

// ============================================================================
// FUNCIONES DEL GRAFO
// ============================================================================

function initializeCharacterGraph() {
    console.log("Inicializando grafo de relaciones...");
    
    // Crear nodos
    characterGraph.addNode("PAPÁ", {
        name: "PAPÁ",
        role: "Investigador",
        suspicionLevel: 0,
        clues: []
    });
    
    characterGraph.addNode("MAMÁ", {
        name: "MAMÁ",
        role: "Cocinera",
        suspicionLevel: 1,
        clues: ["Hizo la torta", "Vi a Ángel cerca de la cocina"]
    });
    
    characterGraph.addNode("MARIEL", {
        name: "MARIEL",
        role: "Hija mayor",
        suspicionLevel: 2,
        clues: ["Grababa TikTok", "Vio a Leia en la cocina"]
    });
    
    characterGraph.addNode("ÁNGEL", {
        name: "ÁNGEL",
        role: "Hijo",
        suspicionLevel: 3,
        clues: ["Fue al gimnasio", "Tenía hambre", "Migas en zapatillas"]
    });
    
    characterGraph.addNode("LEIA", {
        name: "LEIA",
        role: "Mascota",
        suspicionLevel: 1,
        clues: ["Olfatea chocolate", "No puede abrir nevera"]
    });
    
    // Establecer relaciones
    characterGraph.addEdge("MAMÁ", "ÁNGEL", 4);
    characterGraph.addEdge("MARIEL", "LEIA", 2);
    characterGraph.addEdge("ÁNGEL", "MAMÁ", 3, true);
    characterGraph.addEdge("PAPÁ", "MAMÁ", 1, true);
    characterGraph.addEdge("PAPÁ", "MARIEL", 1, true);
    characterGraph.addEdge("PAPÁ", "ÁNGEL", 1, true);
    characterGraph.addEdge("PAPÁ", "LEIA", 1, true);
    characterGraph.addEdge("LEIA", "ÁNGEL", 3);
    
    console.log("Grafo inicializado");
}

function analyzeRelationships() {
    let analysis = "🔗 ANÁLISIS DE RELACIONES (GRAFO) 🔗\n\n";
    
    const mostSuspicious = characterGraph.findMostSuspicious();
    analysis += `🎯 NODO MÁS CONECTADO: ${mostSuspicious ? mostSuspicious.data.name : "N/A"}\n`;
    analysis += `   Conexiones: ${mostSuspicious ? mostSuspicious.getAdjacents().length : 0}\n\n`;
    
    analysis += "📊 RELACIONES ENTRE PERSONAJES:\n";
    for (const node of characterGraph.getAllNodes()) {
        const adjacents = node.getAdjacents();
        if (adjacents.length > 0) {
            analysis += `  ${node.data.name} → `;
            const connections = adjacents.map(({ node: adjNode, weight }) => 
                `${adjNode.data.name} (${weight})`
            ).join(", ");
            analysis += connections + "\n";
        }
    }
    
    analysis += "\n💡 CONCLUSIÓN: ";
    if (mostSuspicious && mostSuspicious.data.name === "ÁNGEL") {
        analysis += "ÁNGEL tiene la mayor cantidad de conexiones sospechosas.\n";
    } else {
        analysis += "Considera todas las evidencias antes de acusar.\n";
    }
    
    return analysis;
}

function updateGraphWithClue(clue) {
    const clueText = clue.toLowerCase();
    
    if (clueText.includes("ángel")) {
        const angelNode = characterGraph.getNode("ÁNGEL");
        if (angelNode) {
            angelNode.data.suspicionLevel = Math.min(5, angelNode.data.suspicionLevel + 1);
        }
    }
    
    console.log("Grafo actualizado con nueva pista");
}

// ============================================================================
// CLASES DEL JUEGO
// ============================================================================

class ImageLoader {
    static async loadImage(url) {
        if (imageCache.has(url)) {
            return imageCache.get(url);
        }
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                imageCache.set(url, img);
                resolve(img);
            };
            
            img.onerror = () => {
                console.error(`Error al cargar imagen: ${url}`);
                const fallback = ImageLoader.createFallbackImage();
                imageCache.set(url, fallback);
                resolve(fallback);
            };
            
            img.src = url;
        });
    }
    
    static createFallbackImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#4dabf7';
        ctx.fillRect(0, 0, 100, 100);
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(50, 40, 20, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
}

class Sprite {
    constructor(x, y, imageUrl, name, color) {
        this.x = x;
        this.y = y;
        this.imageUrl = imageUrl;
        this.name = name;
        this.color = color;
        this.direction = 'down';
        this.width = 32;
        this.height = 32;
        this.speed = CONFIG.PLAYER_SPEED;
        this.image = null;
        this.isLoaded = false;
        this.loadImage();
    }
    
    async loadImage() {
        try {
            this.image = await ImageLoader.loadImage(this.imageUrl);
            this.isLoaded = true;
        } catch (error) {
            console.error(`Error loading image for ${this.name}:`, error);
        }
    }
    
    draw(ctx) {
        if (!this.isLoaded || !this.image) return;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 4, this.y + 4, this.width, this.height);
        
        ctx.save();
        
        if (this.direction === 'left') {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(this.image, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
        
        ctx.restore();
        
        this.drawName(ctx);
    }
    
    drawName(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const textWidth = ctx.measureText(this.name).width;
        ctx.fillRect(
            this.x + this.width/2 - textWidth/2 - 3,
            this.y - 15,
            textWidth + 6,
            12
        );
        
        ctx.fillStyle = this.color;
        ctx.font = 'bold 10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.name, this.x + this.width/2, this.y - 13);
    }
}

class Player extends Sprite {
    constructor(x, y) {
        super(x, y, CHARACTER_IMAGES.papa, 'PAPÁ', '#4dabf7');
        this.speed = CONFIG.PLAYER_SPEED;
        this.isMoving = false;
        this.animationFrame = 0;
        this.animationTimer = 0;
    }
    
    update(deltaTime) {
        this.isMoving = false;
        
        if (!playerCanMove) return;
        
        let moved = false;
        const oldX = this.x;
        const oldY = this.y;
        
        if (keys['arrowleft'] || keys['a']) {
            this.x = Math.max(0, this.x - this.speed);
            this.direction = 'left';
            moved = true;
        }
        if (keys['arrowright'] || keys['d']) {
            this.x = Math.min(CONFIG.CANVAS_WIDTH - this.width, this.x + this.speed);
            this.direction = 'right';
            moved = true;
        }
        if (keys['arrowup'] || keys['w']) {
            this.y = Math.max(0, this.y - this.speed);
            this.direction = 'up';
            moved = true;
        }
        if (keys['arrowdown'] || keys['s']) {
            this.y = Math.min(CONFIG.CANVAS_HEIGHT - this.height, this.y + this.speed);
            this.direction = 'down';
            moved = true;
        }
        
        this.isMoving = moved;
        
        if (moved) {
            this.animationTimer += deltaTime;
            if (this.animationTimer > 150) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = 0;
            }
        }
        
        for (const npc of npcs) {
            if (this.checkCollision(npc)) {
                this.x = oldX;
                this.y = oldY;
                break;
            }
        }
    }
    
    checkCollision(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }
}

class NPC extends Sprite {
    constructor(x, y, imageUrl, name, color, dialogues, clues = []) {
        super(x, y, imageUrl, name, color);
        this.dialogues = dialogues;
        this.clues = clues;
        this.clueGiven = false;
        this.currentDialogue = 0;
        this.idleTimer = 0;
        this.idleDirection = 'down';
        this.speed = CONFIG.NPC_SPEED;
        this.walkTimer = 0;
        this.walkDuration = 0;
        this.targetX = x;
        this.targetY = y;
    }
    
    update(deltaTime) {
        this.idleTimer += deltaTime;
        
        if (this.idleTimer > 3000) {
            const directions = [
                { x: 0, y: -1, dir: 'up' },
                { x: 0, y: 1, dir: 'down' },
                { x: -1, y: 0, dir: 'left' },
                { x: 1, y: 0, dir: 'right' }
            ];
            
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            this.idleDirection = randomDir.dir;
            this.walkDuration = Math.random() * 1000 + 500;
            this.walkTimer = 0;
            this.idleTimer = 0;
            
            this.targetX = this.x + randomDir.x * 50;
            this.targetY = this.y + randomDir.y * 50;
            
            this.targetX = Math.max(50, Math.min(CONFIG.CANVAS_WIDTH - this.width - 50, this.targetX));
            this.targetY = Math.max(50, Math.min(CONFIG.CANVAS_HEIGHT - this.height - 50, this.targetY));
        }
        
        if (this.walkTimer < this.walkDuration) {
            this.walkTimer += deltaTime;
            
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 1) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
        
        const dx = this.targetX - this.x;
        if (Math.abs(dx) > 1) {
            this.direction = dx > 0 ? 'right' : 'left';
        }
    }
    
    getDialogue() {
        const dialogue = this.dialogues[this.currentDialogue];
        
        if (!this.clueGiven && this.currentDialogue >= 1 && this.clues.length > 0) {
            if (Math.random() > 0.5) {
                const clue = this.clues[Math.floor(Math.random() * this.clues.length)];
                this.clueGiven = true;
                collectedClues.push({
                    npc: this.name,
                    clue: clue,
                    room: currentRoom.name,
                    timestamp: new Date()
                });
                
                updateGraphWithClue(clue);
                
                if (cluesCountElement) {
                    cluesCountElement.textContent = collectedClues.length;
                }
                
                return clue;
            }
        }
        
        this.currentDialogue = (this.currentDialogue + 1) % this.dialogues.length;
        return dialogue;
    }
}

class Room {
    constructor(name, color, npcData = [], exits = {}) {
        this.name = name;
        this.color = color;
        this.npcData = npcData;
        this.exits = exits;
        this.floorPattern = this.createFloorPattern();
        this.wallPattern = this.createWallPattern();
    }
    
    createFloorPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, 64, 64);
        
        ctx.fillStyle = this.darkenColor(this.color, 20);
        for (let y = 0; y < 64; y += 16) {
            for (let x = 0; x < 64; x += 16) {
                if ((x + y) % 32 === 0) {
                    ctx.fillRect(x, y, 8, 8);
                    ctx.fillRect(x + 8, y + 8, 8, 8);
                }
            }
        }
        
        return ctx.createPattern(canvas, 'repeat');
    }
    
    createWallPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = this.darkenColor(this.color, 40);
        ctx.fillRect(0, 0, 32, 32);
        
        ctx.fillStyle = this.darkenColor(this.color, 60);
        for (let y = 0; y < 32; y += 8) {
            for (let x = 0; x < 32; x += 8) {
                if (x === y) {
                    ctx.fillRect(x, y, 4, 4);
                }
            }
        }
        
        return ctx.createPattern(canvas, 'repeat');
    }
    
    darkenColor(color, percent) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        const darken = (value) => Math.max(0, Math.min(255, value - value * percent / 100));
        
        return `#${[r, g, b].map(darken).map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('')}`;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.floorPattern;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        this.drawWalls(ctx);
        this.drawExitIndicators(ctx);
    }
    
    drawWalls(ctx) {
        if (!this.name.includes('HAB.') && this.name !== 'COCINA') return;
        
        ctx.fillStyle = this.wallPattern;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, 40);
        ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - 40, CONFIG.CANVAS_WIDTH, 40);
        ctx.fillRect(0, 40, 40, CONFIG.CANVAS_HEIGHT - 80);
        ctx.fillRect(CONFIG.CANVAS_WIDTH - 40, 40, 40, CONFIG.CANVAS_HEIGHT - 80);
    }
    
    drawExitIndicators(ctx) {
        ctx.fillStyle = 'rgba(77, 171, 247, 0.5)';
        ctx.font = 'bold 14px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.exits.up) {
            ctx.fillRect(CONFIG.CANVAS_WIDTH/2 - 40, 0, 80, 10);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('↑', CONFIG.CANVAS_WIDTH/2, 5);
        }
        
        if (this.exits.down) {
            ctx.fillRect(CONFIG.CANVAS_WIDTH/2 - 40, CONFIG.CANVAS_HEIGHT - 10, 80, 10);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('↓', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT - 5);
        }
        
        if (this.exits.left) {
            ctx.fillRect(0, CONFIG.CANVAS_HEIGHT/2 - 20, 10, 40);
            ctx.fillStyle = '#ffffff';
            ctx.save();
            ctx.translate(5, CONFIG.CANVAS_HEIGHT/2);
            ctx.rotate(-Math.PI/2);
            ctx.fillText('←', 0, 0);
            ctx.restore();
        }
        
        if (this.exits.right) {
            ctx.fillRect(CONFIG.CANVAS_WIDTH - 10, CONFIG.CANVAS_HEIGHT/2 - 20, 10, 40);
            ctx.fillStyle = '#ffffff';
            ctx.save();
            ctx.translate(CONFIG.CANVAS_WIDTH - 5, CONFIG.CANVAS_HEIGHT/2);
            ctx.rotate(Math.PI/2);
            ctx.fillText('→', 0, 0);
            ctx.restore();
        }
    }
}

// Datos de las salas
const ROOMS_DATA = {
    "Sala": {
        name: "SALA DE ESTAR",
        color: "#3c6382",
        exits: {
            up: "COCINA",
            down: "HAB. LEIA",
            left: "HAB. ÁNGEL",
            right: "HAB. MARIEL"
        },
        npcs: []
    },
    "Cocina": {
        name: "COCINA",
        color: "#8b4513",
        exits: { down: "SALA DE ESTAR" },
        npcs: [
            {
                name: "MAMÁ",
                image: CHARACTER_IMAGES.mama,
                color: "#ff6b6b",
                x: CONFIG.CANVAS_WIDTH/2 - 16,
                y: 100,
                dialogues: [
                    "¡Hola cariño! ¿Has visto la torta que hice?",
                    "La dejé en la cocina... ¡desapareció!",
                    "Si encuentras al culpable, avísame.",
                    "Vi a Ángel cerca de la cocina ayer..."
                ],
                clues: [
                    "PISTA: Los ingredientes de la torta incluían chocolate extra",
                    "PISTA: La torta tenía nueces, que a Ángel le encantan",
                    "PISTA: Oí ruidos en la cocina cerca de la medianoche"
                ]
            }
        ]
    },
    "Mariel": {
        name: "HAB. MARIEL",
        color: "#7b3c8c",
        exits: { left: "SALA DE ESTAR" },
        npcs: [
            {
                name: "MARIEL",
                image: CHARACTER_IMAGES.mariel,
                color: "#cc5de8",
                x: CONFIG.CANVAS_WIDTH/2 + 100,
                y: CONFIG.CANVAS_HEIGHT/2 - 16,
                dialogues: [
                    "¡Papá! Mira mi nuevo TikTok.",
                    "Yo no toqué la torta, ¡lo juro!",
                    "Vi a Leia pasar por la cocina...",
                    "¿Podemos hacer un video del misterio?"
                ],
                clues: [
                    "PISTA: Grabé un video a las 11:30 PM - se ve sombra en cocina",
                    "PISTA: Ángel dijo que tenía mucha hambre después del gimnasio",
                    "PISTA: La puerta de la cocina chirría, debería oírse"
                ]
            }
        ]
    },
    "Angel": {
        name: "HAB. ÁNGEL",
        color: "#2c5c6c",
        exits: { right: "SALA DE ESTAR" },
        npcs: [
            {
                name: "ÁNGEL",
                image: CHARACTER_IMAGES.angel,
                color: "#51cf66",
                x: CONFIG.CANVAS_WIDTH/2 - 100,
                y: CONFIG.CANVAS_HEIGHT/2 - 16,
                dialogues: [
                    "¿Qué pasa? ¿Necesitas algo?",
                    "¿La torta? No sé nada...",
                    "Tenía hambre, pero no fui yo.",
                    "Pregúntale a Mariel..."
                ],
                clues: [
                    "PISTA: Fui al gimnasio y volví con hambre",
                    "PISTA: Mis zapatillas tenían migas de chocolate",
                    "PISTA: Vi un plato sucio en mi habitación esta mañana"
                ]
            }
        ]
    },
    "Leia": {
        name: "HAB. LEIA",
        color: "#2c6c3e",
        exits: { up: "SALA DE ESTAR" },
        npcs: [
            {
                name: "LEIA",
                image: CHARACTER_IMAGES.leia,
                color: "#ff922b",
                x: CONFIG.CANVAS_WIDTH/2 - 16,
                y: CONFIG.CANVAS_HEIGHT - 100,
                dialogues: [
                    "¡Guau! ¡Guau guau!",
                    "*Mueve la cola felizmente*",
                    "*Olfatea el aire*",
                    "*Se sienta y ladra*"
                ],
                clues: [
                    "PISTA: *Olfatea las manos de Ángel con interés*",
                    "PISTA: *Guarda una miga de chocolate bajo la cama*",
                    "PISTA: *Ladra cuando mencionas 'torta'*"
                ]
            }
        ]
    }
};

const ROOM_NAME_MAP = {
    "COCINA": "Cocina",
    "HAB. LEIA": "Leia",
    "HAB. ÁNGEL": "Angel",
    "HAB. MARIEL": "Mariel",
    "SALA DE ESTAR": "Sala"
};

// ============================================================================
// FUNCIONES PRINCIPALES DEL JUEGO
// ============================================================================

// Event listeners
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    
    if (e.ctrlKey) {
        switch(key) {
            case 'g': // Ctrl+G para análisis de grafo
                e.preventDefault();
                if (inDialogue) {
                    showGraphAnalysis();
                }
                break;
            case 's': // Ctrl+Shift+S para solución
                if (e.shiftKey) {
                    e.preventDefault();
                    showSolution();
                }
                break;
        }
    }
    
    if (key === 'e') {
        e.preventDefault();
        if (!isTransitioning && !inDialogue && activeNPC) {
            interactWithNPC(activeNPC);
        }
    }
    
    if (e.key === ' ' && inDialogue) {
        e.preventDefault();
        skipDialogue();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function showGraphAnalysis() {
    const analysis = analyzeRelationships();
    dialogTextElement.textContent = analysis;
    
    dialogOptionsElement.innerHTML = '';
    
    const backButton = document.createElement('button');
    backButton.className = 'dialog-option';
    backButton.textContent = "VOLVER A OPCIONES";
    backButton.style.background = "linear-gradient(135deg, #4dabf7 0%, #228be6 100%)";
    
    backButton.addEventListener('click', () => {
        showDialogOptions();
    });
    
    dialogOptionsElement.appendChild(backButton);
}

function analyzeClues() {
    if (collectedClues.length === 0) {
        dialogTextElement.textContent = "No has recolectado ninguna pista todavía. Habla más con los personajes.";
        return;
    }
    
    let analysis = "🔍 ANÁLISIS DE PISTAS 🔍\n\n";
    analysis += `📊 Pistas encontradas: ${collectedClues.length}\n\n`;
    
    analysis += "🔎 Contenido de pistas:\n";
    collectedClues.forEach((clue, index) => {
        analysis += `  ${index + 1}. ${clue.npc}: ${clue.clue}\n`;
    });
    
    analysis += "\n🎯 CONCLUSIÓN:\n";
    
    const clueText = collectedClues.map(c => c.clue).join(' ').toLowerCase();
    
    if (clueText.includes('ángel') && clueText.includes('hambre') && clueText.includes('chocolate')) {
        analysis += "SOSPECHOSO PRINCIPAL: ÁNGEL\n";
        analysis += "Motivo: Hambre después del gimnasio + Evidencia circunstancial\n";
        analysis += "Recomendación: Considera acusar a ÁNGEL";
    } else {
        analysis += "No hay suficiente evidencia clara.\n";
        analysis += "Recolecta más información antes de acusar.";
    }
    
    dialogTextElement.textContent = analysis;
}

function showDialogOptions() {
    dialogOptionsElement.innerHTML = '';
    
    const baseOptions = [
        { text: "CONTINUAR", action: "continue" },
        { text: "PREGUNTAR POR TORTA", action: "ask" },
        { text: "CAMBIO TEMA", action: "change" },
        { text: "ANALIZAR PISTAS", action: "analyze" },
        { text: "ANALIZAR GRAFO", action: "graph" },
        { text: "ACUSAR", action: "accuse" },
        { text: "SALIR", action: "exit" }
    ];
    
    baseOptions.forEach(option => {
        const button = document.createElement('button');
        button.className = 'dialog-option';
        button.textContent = option.text;
        button.dataset.action = option.action;
        
        // Colores especiales
        if (option.action === 'accuse') {
            button.style.background = "linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)";
        } else if (option.action === 'analyze') {
            button.style.background = "linear-gradient(135deg, #51cf66 0%, #40c057 100%)";
        } else if (option.action === 'graph') {
            button.style.background = "linear-gradient(135deg, #9966ff 0%, #7744dd 100%)";
        }
        
        button.addEventListener('click', () => handleDialogAction(option.action));
        
        dialogOptionsElement.appendChild(button);
    });
}

// ============================================================================
// FUNCIÓN DE ACUSACIÓN - CORREGIDA
// ============================================================================

function makeAccusation() {
    if (accusationMade) {
        dialogTextElement.textContent = "Ya has hecho una acusación. El caso está cerrado.";
        return;
    }
    
    dialogOptionsElement.innerHTML = '';
    
    dialogTextElement.textContent = "¿A QUIÉN QUIERES ACUSAR?\n\nSelecciona un sospechoso:";
    
    const suspects = ["MAMÁ", "MARIEL", "ÁNGEL", "LEIA"];
    
    suspects.forEach(suspect => {
        const button = document.createElement('button');
        button.className = 'dialog-option';
        button.textContent = `ACUSAR A ${suspect}`;
        button.dataset.suspect = suspect;
        
        // Color diferente para cada sospechoso
        if (suspect === "MAMÁ") {
            button.style.background = "linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)";
        } else if (suspect === "MARIEL") {
            button.style.background = "linear-gradient(135deg, #cc5de8 0%, #be4bdb 100%)";
        } else if (suspect === "ÁNGEL") {
            button.style.background = "linear-gradient(135deg, #51cf66 0%, #40c057 100%)";
        } else if (suspect === "LEIA") {
            button.style.background = "linear-gradient(135deg, #ff922b 0%, #fd7e14 100%)";
        }
        
        button.addEventListener('click', () => handleAccusation(suspect));
        
        dialogOptionsElement.appendChild(button);
    });
    
    // Botón para cancelar
    const cancelButton = document.createElement('button');
    cancelButton.className = 'dialog-option';
    cancelButton.textContent = "CANCELAR";
    cancelButton.style.background = "linear-gradient(135deg, #868e96 0%, #495057 100%)";
    cancelButton.addEventListener('click', () => {
        showDialogOptions();
        dialogTextElement.textContent = "Acusación cancelada. Continúa investigando.";
    });
    
    dialogOptionsElement.appendChild(cancelButton);
}

function handleAccusation(suspect) {
    const correctCulprit = CONFIG.TORTA_CULPABLE;
    
    dialogOptionsElement.innerHTML = '';
    
    if (suspect === correctCulprit) {
        // ACUSACIÓN CORRECTA
        dialogTextElement.textContent = `🎉 ¡FELICIDADES! 🎉\n\n`;
        dialogTextElement.textContent += `Has acusado correctamente a ${suspect}.\n`;
        dialogTextElement.textContent += `\n${suspect} confiesa: "¡Es cierto! Tenía hambre después del gimnasio y no pude resistirme."\n`;
        dialogTextElement.textContent += `\n🏆 MISTERIO RESUELTO 🏆`;
        
        accusationMade = true;
        gameHintElement.textContent = "¡Misterio resuelto! El culpable ha sido encontrado.";
        gameHintElement.style.color = "#51cf66";
        
    } else {
        // ACUSACIÓN INCORRECTA
        dialogTextElement.textContent = `❌ ¡ACUSACIÓN INCORRECTA! ❌\n\n`;
        dialogTextElement.textContent += `${suspect} no es el culpable.\n`;
        
        if (suspect === "MAMÁ") {
            dialogTextElement.textContent += `\nMAMÁ dice: "¡Yo hice la torta! ¿Por qué la robaría?"`;
        } else if (suspect === "MARIEL") {
            dialogTextElement.textContent += `\nMARIEL dice: "¡Estaba grabando TikToks! Tengo videos como prueba."`;
        } else if (suspect === "LEIA") {
            dialogTextElement.textContent += `\nLEIA: "¡Guau! *mueve la cola* (Los perros no pueden abrir neveras)"`;
        }
        
        dialogTextElement.textContent += `\n\n🔍 Necesitas más evidencia.`;
    }
    
    // Botón para continuar
    const continueButton = document.createElement('button');
    continueButton.className = 'dialog-option';
    continueButton.textContent = "CONTINUAR";
    continueButton.style.background = "linear-gradient(135deg, #4dabf7 0%, #228be6 100%)";
    continueButton.addEventListener('click', () => {
        if (suspect === correctCulprit) {
            skipDialogue();
        } else {
            showDialogOptions();
        }
    });
    
    dialogOptionsElement.appendChild(continueButton);
}

function handleDialogAction(action) {
    switch(action) {
        case 'continue':
            const dialogue = activeNPC.getDialogue();
            dialogTextElement.textContent = dialogue;
            conversationHistory.addConversation(activeNPC.name, dialogue);
            break;
            
        case 'ask':
            const askResponses = {
                "MAMÁ": "¿La torta? La hice con mucho cariño para hoy...",
                "MARIEL": "¡Yo no fui! Estaba grabando TikToks toda la noche.",
                "ÁNGEL": "Eh... no sé nada de ninguna torta... *suda*",
                "LEIA": "¡Guau! *mueve la cola*"
            };
            
            const askResponse = askResponses[activeNPC.name] || "No sé nada sobre esa torta...";
            dialogTextElement.textContent = `${activeNPC.name}: ${askResponse}`;
            conversationHistory.addConversation(activeNPC.name, askResponse);
            break;
            
        case 'change':
            const changeTopics = [
                "¿Cómo te va en el trabajo?",
                "¿Viste el partido?",
                "Hace buen clima hoy.",
                "¿Qué planes para el fin de semana?"
            ];
            const topic = changeTopics[Math.floor(Math.random() * changeTopics.length)];
            dialogTextElement.textContent = `${activeNPC.name}: ${topic}`;
            conversationHistory.addConversation(activeNPC.name, topic);
            break;
            
        case 'analyze':
            analyzeClues();
            break;
            
        case 'graph':
            showGraphAnalysis();
            break;
            
        case 'accuse':
            makeAccusation();
            break;
            
        case 'exit':
            skipDialogue();
            break;
    }
}

function showSolution() {
    if (accusationMade) return;
    
    const solution = investigationTree.getSolution();
    dialogTextElement.textContent = `SOLUCIÓN: ${solution.npcName} es el culpable. ${solution.clue}`;
    
    accusationMade = true;
    gameHintElement.textContent = "¡Misterio resuelto! El culpable ha sido encontrado.";
    gameHintElement.style.color = "#51cf66";
}

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function checkRoomTransition() {
    if (isTransitioning || inDialogue || !playerCanMove) return;
    
    let direction = null;
    let roomDisplayName = null;
    
    if (player.y <= CONFIG.TRANSITION_THRESHOLD && currentRoom.exits.up) {
        direction = 'up';
        roomDisplayName = currentRoom.exits.up;
    } else if (player.y >= CONFIG.CANVAS_HEIGHT - player.height - CONFIG.TRANSITION_THRESHOLD && currentRoom.exits.down) {
        direction = 'down';
        roomDisplayName = currentRoom.exits.down;
    } else if (player.x <= CONFIG.TRANSITION_THRESHOLD && currentRoom.exits.left) {
        direction = 'left';
        roomDisplayName = currentRoom.exits.left;
    } else if (player.x >= CONFIG.CANVAS_WIDTH - player.width - CONFIG.TRANSITION_THRESHOLD && currentRoom.exits.right) {
        direction = 'right';
        roomDisplayName = currentRoom.exits.right;
    }
    
    if (direction && roomDisplayName) {
        animationQueue.enqueue({
            type: 'room_transition',
            room: roomDisplayName,
            direction: direction
        });
        processAnimationQueue();
    }
}

function processAnimationQueue() {
    if (isTransitioning || animationQueue.isEmpty()) return;
    
    const nextAnimation = animationQueue.front();
    
    if (nextAnimation.type === 'room_transition') {
        animationQueue.dequeue();
        transitionToRoom(nextAnimation.room, nextAnimation.direction);
    }
}

function transitionToRoom(roomDisplayName, direction) {
    if (isTransitioning) return;
    
    isTransitioning = true;
    playerCanMove = false;
    
    const roomKey = ROOM_NAME_MAP[roomDisplayName];
    if (!roomKey || !ROOMS_DATA[roomKey]) {
        console.error("Sala no encontrada:", roomDisplayName);
        isTransitioning = false;
        playerCanMove = true;
        return;
    }
    
    gameHintElement.textContent = `Cambiando a ${roomDisplayName}...`;
    
    setTimeout(() => {
        changeRoom(roomKey, direction);
        
        setTimeout(() => {
            isTransitioning = false;
            playerCanMove = true;
            gameHintElement.textContent = "Llega a los bordes de la pantalla para cambiar de sala";
            processAnimationQueue();
        }, 500);
    }, 300);
}

function changeRoom(roomKey, direction) {
    const roomData = ROOMS_DATA[roomKey];
    
    currentRoom = new Room(roomData.name, roomData.color, roomData.npcs, roomData.exits);
    
    npcs = [];
    if (roomData.npcs) {
        roomData.npcs.forEach(npcData => {
            const npc = new NPC(
                npcData.x,
                npcData.y,
                npcData.image,
                npcData.name,
                npcData.color,
                npcData.dialogues,
                npcData.clues || []
            );
            npcs.push(npc);
        });
    }
    
    switch(direction) {
        case 'up':
            player.y = CONFIG.CANVAS_HEIGHT - player.height - 50;
            player.x = CONFIG.CANVAS_WIDTH/2 - player.width/2;
            player.direction = 'down';
            break;
        case 'down':
            player.y = 50;
            player.x = CONFIG.CANVAS_WIDTH/2 - player.width/2;
            player.direction = 'up';
            break;
        case 'left':
            player.x = CONFIG.CANVAS_WIDTH - player.width - 50;
            player.y = CONFIG.CANVAS_HEIGHT/2 - player.height/2;
            player.direction = 'right';
            break;
        case 'right':
            player.x = 50;
            player.y = CONFIG.CANVAS_HEIGHT/2 - player.height/2;
            player.direction = 'left';
            break;
    }
    
    updateRoomInfo();
    updateMapHighlight(roomKey);
}

function updateRoomInfo() {
    roomNameElement.textContent = currentRoom.name;
    
    const charactersContainer = charactersPresentElement;
    charactersContainer.innerHTML = '';
    
    if (npcs.length > 0) {
        npcs.forEach(npc => {
            const characterCard = document.createElement('div');
            characterCard.className = 'character-card';
            characterCard.innerHTML = `
                <div class="character-portrait">
                    <i class="fas fa-user" style="color: ${npc.color}; font-size: 2rem;"></i>
                </div>
                <div class="character-details">
                    <div class="character-name">${npc.name}</div>
                    <div class="character-status">${npc.clueGiven ? "PISTA OBTENIDA" : "PRESENTE"}</div>
                </div>
            `;
            charactersContainer.appendChild(characterCard);
        });
    } else {
        charactersContainer.innerHTML = '<div class="character-card"><div class="character-details"><div class="character-name">NINGUNO</div></div></div>';
    }
    
    document.getElementById('exit-up').textContent = currentRoom.exits.up || "---";
    document.getElementById('exit-down').textContent = currentRoom.exits.down || "---";
    document.getElementById('exit-left').textContent = currentRoom.exits.left || "---";
    document.getElementById('exit-right').textContent = currentRoom.exits.right || "---";
    
    if (cluesCountElement) {
        cluesCountElement.textContent = collectedClues.length;
    }
}

function updateMapHighlight(roomKey) {
    document.querySelectorAll('.map-cell.room').forEach(cell => {
        cell.classList.remove('current');
    });
    
    const mapCell = document.getElementById(`map-${roomKey.toLowerCase()}`);
    if (mapCell) {
        mapCell.classList.add('current');
    }
}

function interactWithNPC(npc) {
    inDialogue = true;
    playerCanMove = false;
    activeNPC = npc;
    
    dialogStack.push({
        npc: npc.name,
        dialogueIndex: npc.currentDialogue
    });
    
    conversationHistory.addConversation(npc.name, "Inicio de conversación");
    
    dialogueStatusElement.textContent = "ACTIVO";
    dialogueStatusElement.style.color = "#ffd700";
    
    const dialogue = npc.getDialogue();
    dialogTextElement.textContent = dialogue;
    
    showDialogOptions();
}

function skipDialogue() {
    inDialogue = false;
    playerCanMove = true;
    
    if (!dialogStack.isEmpty()) {
        dialogStack.pop();
    }
    
    activeNPC = null;
    
    dialogueStatusElement.textContent = "INACTIVO";
    dialogueStatusElement.style.color = "#ff6b6b";
    
    dialogTextElement.textContent = "Acércate a un personaje y presiona E para hablar.";
    dialogOptionsElement.innerHTML = '';
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime || 0;
    lastTime = timestamp;
    
    if (!isTransitioning) {
        player.update(deltaTime);
        
        if (!inDialogue) {
            npcs.forEach(npc => {
                if (npc.update) npc.update(deltaTime);
            });
            
            activeNPC = null;
            for (const npc of npcs) {
                const distance = calculateDistance(
                    player.x + player.width/2,
                    player.y + player.height/2,
                    npc.x + npc.width/2,
                    npc.y + npc.height/2
                );
                
                if (distance < CONFIG.INTERACTION_DISTANCE) {
                    activeNPC = npc;
                    
                    gameHintElement.textContent = `Presiona E para hablar con ${npc.name}`;
                    break;
                }
            }
            
            if (!activeNPC) {
                gameHintElement.textContent = "Llega a los bordes de la pantalla para cambiar de sala";
            }
            
            checkRoomTransition();
        }
    }
    
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    if (currentRoom) {
        currentRoom.draw(ctx);
    }
    
    npcs.forEach(npc => {
        if (npc.isLoaded) {
            npc.draw(ctx);
            
            if (activeNPC === npc && !inDialogue && !isTransitioning) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 14px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText('!', npc.x + npc.width/2, npc.y - 10);
            }
        }
    });
    
    if (player.isLoaded) {
        player.draw(ctx);
    }
    
    requestAnimationFrame(gameLoop);
}

async function initGame() {
    if (gameInitialized) return;
    
    console.log("Inicializando juego...");
    
    initializeCharacterGraph();
    
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    
    player = new Player(
        CONFIG.CANVAS_WIDTH/2 - 16,
        CONFIG.CANVAS_HEIGHT/2 - 16
    );
    
    await player.loadImage();
    
    collectedClues = [];
    
    changeRoom("Sala", "down");
    
    setupMapEvents();
    
    gameInitialized = true;
    requestAnimationFrame(gameLoop);
    
    console.log("¡Juego inicializado!");
    console.log("El culpable es: ÁNGEL");
    
    setTimeout(() => {
        gameHintElement.textContent = "¡Bienvenido detective! Habla con los personajes (E) y reúne pistas.";
    }, 1000);
}

function setupMapEvents() {
    const mapCells = document.querySelectorAll('.map-cell.room');
    mapCells.forEach(cell => {
        cell.addEventListener('click', () => {
            const roomId = cell.id.replace('map-', '').toUpperCase();
            const roomKey = ROOM_NAME_MAP[roomId] || roomId.charAt(0).toUpperCase() + roomId.slice(1).toLowerCase();
            
            if (ROOMS_DATA[roomKey] && roomKey !== currentRoom.name.split(' ')[0].toLowerCase()) {
                gameHintElement.textContent = `Cambiando a ${ROOMS_DATA[roomKey].name}...`;
                
                let direction = 'down';
                if (roomKey === 'Cocina') direction = 'up';
                else if (roomKey === 'Leia') direction = 'down';
                else if (roomKey === 'Angel') direction = 'left';
                else if (roomKey === 'Mariel') direction = 'right';
                
                transitionToRoom(ROOMS_DATA[roomKey].name, direction);
            }
        });
    });
}

window.addEventListener('load', initGame);

document.querySelectorAll('.exit-item').forEach(exit => {
    exit.addEventListener('click', () => {
        const direction = exit.dataset.direction;
        const roomName = exit.querySelector('.exit-name').textContent;
        
        if (roomName !== '---' && currentRoom.exits[direction]) {
            transitionToRoom(roomName, direction);
        }
    });
});

// Añadir CSS para estados del juego
const gameStateCSS = `
    .victory {
        background: linear-gradient(135deg, #51cf66 0%, #2b8a3e 100%) !important;
        border-color: #00ff00 !important;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
`;

const style = document.createElement('style');
style.textContent = gameStateCSS;
document.head.appendChild(style);