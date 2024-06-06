const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players ={};
let playerRole = "w";


app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get("/", (req, res)=>{
    res.render("index", {title:"Chess Game"});
});

io.on("connection", function(uniqueSocket){
    console.log("A user connected:", uniqueSocket.id);

    if(!players.white){
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "w");
    }
    else if(!players.black){
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole","b");
    } else{
        uniqueSocket.emit("spectatorRole");
    }

    uniqueSocket.on("disconnect", function(){
        console.log("User disconnected:", uniqueSocket.id);

        if(uniqueSocket.id === players.black){
            delete players.black;
        }else if(uniqueSocket.id === players.white){
            delete players.white;
        }
    });

     uniqueSocket.on("move", (move)=>{
        try{
            if(chess.turn()==='w' && uniqueSocket.id !==players.white)return;
            if(chess.turn()==='b' && uniqueSocket.id !==players.black)return;

            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            }else{
                console.log("Invalid move : ", move);
                uniqueSocket.emit(" Invalid Move",move);
            }
        }catch(err){
            console.log(err);
            uniqueSocket.emit("Invalid move", move);
        }
     })
})

server.listen(3000, function(){
    console.log('server is listening on port 3000');
});