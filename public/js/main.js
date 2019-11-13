class Logger
{
    constructor(logFunction, allowedLogTypes)
    {
        this.logFunction = logFunction;
        this.allowedLogTypes = allowedLogTypes;
    }

    log(logType, message)
    {
        if (this.allowedLogTypes.includes(logType)) { this.logFunction(logType, message); }
    }

    logTypeFactory(logType) { return (message) => { this.log(logType, message); } }
}

class Team
{
    constructor(teamName)
    {
        this.teamName = teamName;
        this.points = 0;
        this.wrongs = 0;
    }

    reset() { this.wrongs = 0; }
}

class Game
{
    constructor(questions, teamA, teamB, logger)
    {
        this.questions = questions;
        this.activeQuestionIndex = 0;

        this.teamA = teamA;
        this.teamB = teamB;

        this.infoLog = logger.logTypeFactory('game_info');
        this.errorLog = logger.logTypeFactory('game_error');

        this.points = 0;

        this.state = 1;
        /**
         *  this.state:
         *      1 -> vybera sa zacinajucu (kdo rychlejsie stlaci)
         *      2 -> zacinajuci hada
         *      3 -> [optional] hada sa castejsia
         *      4 -> tym hada
         *      5 -> [optional] tym dojebal, druhy tym hada jednu
         *      6 -> zobrazenie ostatnych odpovedi
         */
        this.stateData = {
            1: {},
            2: {
                'teamA': true,
            },
            3: {
                'teamA': true,
                'best': 0,
            },
            4: {
                'teamA': true,
            },
            5: {
                'teamA': true,
            },
        }
    }

    reset()
    {
        this.points = 0;

        this.teamA.wrongs = 0;
        this.teamB.wrongs = 0;

        this.state = 1;

        this.stateData = {
            1: {},
            2: {
                'teamA': true,
            },
            3: {
                'teamA': true,
                'best': 0,
            },
            4: {
                'teamA': true,
            },
            5: {
                'teamA': true,
            },
        }
    }

    showInfo()
    {
        this.infoLog(this.state)
        console.log(this.stateData)
    }

    getTeam(teamA) { return teamA ? this.teamA : this.teamB; }

    get activeQuestion() { return this.questions[this.activeQuestionIndex]; }
    get activeTeam() { return [2, 3, 4, 5].includes(this.state) ? this.getTeam(this.stateData[this.state]['teamA']) : undefined; }

    parseAnswerIndex(answerIndexRaw)
    {
        let success = false;
        let answerIndex;

        if ((new RegExp('^[0-9]+$')).test(answerIndexRaw))
        {
            answerIndex = parseInt(answerIndexRaw);
            if (answerIndex >= 1 && answerIndex <= this.activeQuestion['answers'].length) { success = true; }
        }

        return [success, answerIndex]
    }

    guess(answerIndex)
    {
        this.showAnswer(answerIndex);
        this.points += this.activeQuestion['answers'][answerIndex-1]['points']*this.activeQuestion['multiplier'];
    }

    showAnswer(answerIndex) { this.activeQuestion['answers'][answerIndex-1]['guessed'] = true; }

    win()
    {
        this.activeTeam.points += this.points;
    }

    do(command)
    {
        if (this.state === 1)
        {
            let success = true;

            if (command === 'a') { this.stateData[2]['teamA'] = true; }
            else if (command === 'b') { this.stateData[2]['teamA'] = false; }
            else { success = false; }

            if (success) { this.state = 2; }

            if (success) { this.showInfo(); }
            else { this.errorLog(`unknown command \'${command}\' (valid commands: \'a\', \'b\')`) }
        }
        else if (this.state === 2)
        {
            let success = true;

            if (command === 'x')
            {
                this.stateData[3]['teamA'] = !this.stateData[2]['teamA'];
                this.stateData[3]['best'] = null;
                this.state = 3;
            }
            else
            {
                let [successX, answerIndex] = this.parseAnswerIndex(command);

                if (successX)
                {
                    this.guess(answerIndex)

                    if (answerIndex === 1)
                    {
                        this.stateData[4]['teamA'] = this.stateData[2]['teamA'];
                        this.state = 4;
                    }
                    else
                    {
                        this.stateData[3]['teamA'] = !this.stateData[2]['teamA'];
                        this.stateData[3]['best'] = answerIndex;
                        this.state = 3;
                    }
                }
                else {success = false;}
            }

            if (success) { this.showInfo(); }
            else { this.errorLog(`wrong question index \'${command}\' (enter question index between 0-*max question index* or \'x\')`); }
        }
        else if (this.state === 3)
        {
            let success = true;

            if (command === 'x')
            {
                if (this.stateData[3]['best'] === null) { this.stateData[3]['teamA'] = !this.stateData[3]['teamA']; }
                else
                {
                    this.stateData[4]['teamA'] = !this.stateData[3]['teamA'];
                    this.state = 4;
                }
            }
            else
            {
                let [successX, answerIndex] = this.parseAnswerIndex(command);

                if (successX)
                {
                    this.guess(answerIndex)
                    
                    if (this.stateData[3]['best'] === null)
                    {
                        this.stateData[4]['teamA'] = this.stateData[3]['teamA'];
                        this.state = 4;
                    }
                    else
                    {
                        if (answerIndex < this.stateData[3]['best']) {
                            this.stateData[4]['teamA'] = this.stateData[3]['teamA'];
                            this.state = 4;
                        }
                        else
                        {
                            this.stateData[4]['teamA'] = !this.stateData[3]['teamA'];
                            this.state = 4;
                        }
                    }
                }
                else {success = false;}
            }

            if (success) { this.showInfo(); }
            else { this.errorLog(`wrong question index \'${command}\' (enter question index between 0-*max question index* or \'x\')`); }
        }
        else if (this.state === 4)
        {
            let success = true;

            if (command === 'x')
            {
                this.activeTeam.wrongs += 1;

                if (this.activeTeam.wrongs === 3)
                {
                    this.stateData[5]['teamA'] = !this.stateData[4]['teamA'];
                    this.state = 5;
                }
            }
            else
            {
                let [successX, answerIndex] = this.parseAnswerIndex(command);

                if (successX)
                {
                    this.guess(answerIndex);

                    let guessedAll = true;
                    for (let answer of this.activeQuestion['answers'])
                    {
                        if (!answer['guessed'])
                        {
                            guessedAll = false;
                            break;
                        }
                    }

                    if (guessedAll)
                    {
                        this.win();
                        this.state = 6;
                    }
                }
                else {success = false;}
            }

            if (success) { this.showInfo(); }
            else { this.errorLog(`wrong question index \'${command}\' (enter question index between 0-*max question index* or \'x\')`); }
        }
        else if (this.state === 5)
        {
            let success = true;

            if (command === 'x')
            {
                this.activeTeam.wrongs = 3;
                this.stateData[5]['teamA'] = !this.stateData[5]['teamA'];

                this.win();
                this.state = 6;
            }
            else
            {
                let [successX, answerIndex] = this.parseAnswerIndex(command);

                if (successX)
                {
                    this.showAnswer(answerIndex);

                    this.win();
                    this.state = 6;
                }
                else {success = false;}
            }

            if (success) { this.showInfo(); }
            else { this.errorLog(`wrong question index \'${command}\' (enter question index between 0-*max question index* or \'x\')`); }
        }
        else if (this.state === 6)
        {
            let success = true;

            if (command === 'n')
            {
                this.reset();
                this.activeQuestionIndex += 1;
            }
            else
            {
                let [successX, answerIndex] = this.parseAnswerIndex(command);

                if (successX) { this.showAnswer(answerIndex); }
                else {success = false;}
            }

            if (success) { this.showInfo(); }
            else { this.errorLog(`wrong question index \'${command}\' (enter question index between 0-*max question index* or \'x\')`); }
        }
    }

    draw()
    {
        const totalPointsX = width/2;
        const totalPointsY = height*(1/10);
        const totalPointsSize = height*(1/8);

        textFont('consolas');
        textSize(totalPointsSize);
        noStroke();
        fill(0);
        textAlign(CENTER, CENTER);
        text(this.points, totalPointsX, totalPointsY);

        const answerStartX = width*(1/15);
        const answerStartY = height*(1/5);
        const answerHeight = height*(1/13);
        const answerIndexWidth = answerHeight*(3/2);

        let drawAnswer = (answer, answerIndex) => {
            let answerX = answerStartX;
            let answerY = answerStartY+answerIndex*answerHeight;

            if (answer['guessed'])
            {
                stroke(0);
                noFill();

                rect(answerX, answerY, width-answerX*2, answerHeight);
                line(width-answerX-answerIndexWidth, answerY, width-answerX-answerIndexWidth, answerY+answerHeight);

                textFont('consolas');
                textSize(answerHeight*(3/5));
                noStroke();
                fill(0);

                textAlign(CENTER, CENTER);
                text(`${answerIndex+1}.`, answerX+answerIndexWidth/2, answerY+answerHeight/2);

                textAlign(LEFT, CENTER);
                text(answer['text'], answerX+answerIndexWidth, answerY+answerHeight/2)

                textAlign(CENTER, CENTER);
                text(answer['points'], width-answerX-answerIndexWidth/2, answerY+answerHeight/2);
            }
            else
            {
                stroke(0);
                fill(0);

                rect(answerX, answerY, width-answerX*2, answerHeight);

                textFont('consolas');
                textSize(answerHeight*(3/5));
                noStroke();
                fill(255);

                textAlign(CENTER, CENTER);
                text(`${answerIndex+1}.`, answerX+answerIndexWidth/2, answerY+answerHeight/2);
            }
        }
        this.activeQuestion['answers'].forEach(drawAnswer);

        const teamPointsStartX = width*(1/7);
        const teamPointsStartY = height*(8/9);
        const teamPointsSize = height*(1/8);

        let drawTeam = (team, pos) => {
            let teamPointsX = teamPointsStartX+(width-2*teamPointsStartX)*pos;
            let teamPointsY = teamPointsStartY;

            textFont('consolas');
            noStroke();
            fill(0);
            textAlign(CENTER, CENTER);

            textSize(teamPointsSize);
            text(team.points, teamPointsX, teamPointsY);

            textSize(teamPointsSize*(1/3));
            text(team.wrongs, teamPointsX, teamPointsY-teamPointsSize/2-teamPointsSize*(1/6));
        }

        drawTeam(this.teamA, 0);
        drawTeam(this.teamB, 1);
    }
}



let game;
let logger;



function setup()
{
    let canvas = createCanvas(windowWidth-1, windowHeight-4);
    canvas.parent('canvasParent');

    logger = new Logger((logType, message) => console.log(`[${logType}] ${message}`), ['game_info', 'game_error']);

    game = new Game(questions, new Team('teamA'), new Team('teamB'), logger);
    game.reset();
}

function draw()
{
    background(255, 255, 255);

    game.draw();
}


function i(command) { game.do(command) }