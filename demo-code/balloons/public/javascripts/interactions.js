const USED = -1; //letter has been used, not available anymore
const AVAIL = 1; //letter has not been used yet

//placeholders ...
const PH_WORD = "THEMUMMY";

/* basic constructor of game state */
function GameState(visibleWordBoard){

    this.playerType = null;
    this.MAX_ALLOWED = Setup.MAX_ALLOWED_GUESSES;
    this.wrongGuesses = 0;
    this.visibleWordArray = new Array(Setup.MAX_WORD_LENGTH);
    this.visibleWordArray.fill("#");
    this.alphabet = new Alphabet();
    this.alphabet.initialize();
    this.visibleWordBoard = visibleWordBoard;
    this.targetWord = null;

    this.getPlayerType = function () {
        return this.playerType;
    }

    this.setPlayerType = function (p) {
        this.playerType = p;
    }

    this.setTargetWord = function (w) {
        this.targetWord = w;
    }

    this.getVisibleWordArray = function(){
        return this.visibleWordArray;
    };

    this.incrWrongGuess = function(){
        this.wrongGuesses++;
    };

    this.isGameOver = function(){
        return (this.wrongGuesses>this.MAX_ALLOWED);
    };

    this.revealLetters = function(letter){
        var indices = this.alphabet.getLetterInWordIndices(letter, this.targetWord);
        for(let i=0; i<indices.length; i++){
            this.visibleWordArray[ indices[i] ] = letter;
        }
    };

    this.updateGame = function(clickedLetter){

        var res = this.alphabet.getLetterInWordIndices(clickedLetter, this.targetWord);

        //wrong guess?
        if(res.length == 0){
            this.incrWrongGuess();
        }

        //game over?
        if( this.isGameOver() ){
            console.log("Game lost!");
        }
        else {
            this.revealLetters(clickedLetter);
            this.alphabet.makeLetterUnAvailable(clickedLetter);
            this.visibleWordBoard.setWord(this.visibleWordArray);
        }
    };
}

function Alphabet(){

    this.letters = undefined;

    this.initialize = function(){
        this.letters = {
            A: AVAIL,
            B: AVAIL,
            C: AVAIL,
            D: AVAIL,
            E: AVAIL,
            F: AVAIL,
            G: AVAIL,
            H: AVAIL,
            I: AVAIL,
            J: AVAIL,
            K: AVAIL,
            L: AVAIL,
            M: AVAIL,
            N: AVAIL,
            O: AVAIL,
            P: AVAIL,
            Q: AVAIL,
            R: AVAIL,
            S: AVAIL,
            T: AVAIL,
            U: AVAIL,
            V: AVAIL,
            W: AVAIL,
            X: AVAIL,
            Y: AVAIL,
            Z: AVAIL
        };
    };

    //is it a valid letter?
    this.isLetter = function(letter){
        console.assert(typeof letter === "string", "Single string expected");
        return this.letters.hasOwnProperty(letter);
    };

    //is it an available letter?
    this.isLetterAvailable = function(letter){
        console.assert(typeof letter === "string", "Single string expected");
        return (this.isLetter(letter) && this.letters[letter]==AVAIL);
    };

    this.makeLetterUnAvailable = function(letter){
        console.assert(typeof letter === "string", "Single string expected");
        if( this.isLetter(letter)){
            this.letters[letter] = USED;
        }
    };

    //does the letter appear in the word?
    this.isLetterIn = function(letter, word){
        console.assert(typeof letter === "string", "String expected");
        console.assert(typeof word === "string", "String expected");
        if( !this.isLetter(letter) || !this.isLetterAvailable(letter)){
            return false;
        }
        return (word.indexOf(letter)>=0);
    };

    //letter locations in the word
    this.getLetterInWordIndices = function(letter, word){
        console.assert(typeof letter === "string", "String expected");
        console.assert(typeof word === "string", "String expected");

        var res = [];
        
        if(!this.isLetterIn(letter, word)){
            console.log("Letter is not in target word!");
            return res;
        }
        
        for(let i=0; i<word.length; i++){
            if(word.charAt(i) == letter){
                res.push(i);
            }
        }
        return res;       
    };
}

function VisibleWordBoard(){

    //set hidden word in the correct div element
    this.setWord = function(visibleWord){

        //dynamic language issues ...
        console.assert(Array.isArray(visibleWord), "Expecting an array, got a %s instead" );

        document.getElementById("hiddenWord").innerHTML = visibleWord.join("");
    };
}

function AlphabetBoard(gs){

    this.initialize = function(){

        var elements = document.querySelectorAll(".alphabet");
        Array.from(elements).forEach( function(el){

            el.addEventListener("click", function(e){
                var clickedLetter = e.originalTarget.id;
                gs.updateGame(clickedLetter);

                //"testing" ...
                console.log(clickedLetter); 
            });
        });
    };
}


//set everything up, including the WebSocket
(function setup(){
    var vw = new VisibleWordBoard();
    var gs = new GameState(vw);
    var ab = new AlphabetBoard(gs);
    ab.initialize();
    vw.setWord(gs.getVisibleWordArray());

    console.log("Connecting to server WebSocket ...");
    var socket = new WebSocket(Setup.WEB_SOCKET_URL);

    socket.onmessage = function (event) {

        var incomingMsg = JSON.parse(event.data);

        //set player type
        if (incomingMsg.type == Messages.T_PLAYER_TYPE) {
            console.log("Player type is %s", incomingMsg.type);
            gs.setPlayerType( incomingMsg.data );//should be "A" or "B"

            //if player type is A, (1) pick a word, and (2) sent it to the server
            if (gs.getPlayerType() == "A") {
                var res = prompt("Select the word to play!");
                gs.setTargetWord(res);
                var outgoingMsg = Messages.MSG_TARGET_WORD;
                console.log(typeof (outgoingMsg));
                outgoingMsg.data = res;
                socket.send(JSON.stringify(outgoingMsg));
            }
        }
    };

    socket.onopen = function(){
        socket.send("hello!");
    };
    
    socket.onclose = function(){
        alert("closed");
    };

    socket.onerror = function(){
        alert("error!");
    };

})(); //execute immediately



