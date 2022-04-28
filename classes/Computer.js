function Computer() {
    this.unlocked = 0;
    this.threads = 1;
    this.freeThreads = 1;
    this.speed = 1;

    this.tick = function() {
        for(var i = 0; i < this.processes.length; i++) {
            this.tickRow(this.processes[i], this.speed * this.processes[i].threads);
        }
    };

    this.tickRow = function(row, ticksGained) {
        if(ticksGained === 0 || (row.done && row.done())) {
            row.isMoving = 0;
            return;
        }
        var cost = ticksGained * row.cost;
        if(row.costType) {
            if(game[row.costType] < cost) {
                row.isMoving = 0;
                return;
            }
            game[row.costType] -= cost;
        }
        row.currentTicks += ticksGained;
        row.isMoving = 1;
        if(row.currentTicks >= row.ticksNeeded) {
            var overflow = row.currentTicks - row.ticksNeeded;
            row.currentTicks = 0;
            row.completions++;
            row.finish();
            this.tickRow(row, overflow); //recursive, but on the new cost
        }
    };

    this.unlockComputer = function() {
        if(game.science >= 1000) {
            game.science -= 1000;
            this.unlocked = 1;
            view.checkComputerUnlocked();
        }
        view.updateComputer();
    };

    this.buyThread = function() {
        var threadCost = this.getThreadCost();
        if(game.science >= threadCost) {
            game.science -= threadCost;
            this.threads++;
            this.freeThreads++;
        }
        view.updateComputer();
    };
    this.getThreadCost = function() {
        return precision2(Math.pow(2, this.threads)*500);
    };

    this.buySpeed = function() {
        var speedCost = this.getSpeedCost();
        if(game.cash >= speedCost) {
            game.cash -= speedCost;
            this.speed++;
        }
        view.updateComputer();
    };
    this.getSpeedCost = function() {
        return precision2(Math.pow(2, this.speed)*500);
    };

    this.addThread = function(dataPos, numAdding) {
        if (this.freeThreads >= numAdding) {
            this.processes[dataPos].threads += numAdding;
            this.freeThreads -= numAdding;
        }
        view.updateComputer();
    };
    this.removeThread = function(dataPos, numRemoving) {
        if(this.processes[dataPos].threads >= numRemoving) {
            this.processes[dataPos].threads -= numRemoving;
            this.freeThreads += numRemoving;
        }
        view.updateComputer();
    };

    this.processes = [
        { //Optimize Land
            currentTicks: 0,
            ticksNeeded: 600,
            threads: 0,
            cost:0,
            costType:"",
            finish:function() { game.land.improveLand(); this.ticksNeeded = Math.floor(game.land.baseLand); },
            showing: function() { return true; }
        },
        { //Buy Ice
            currentTicks: 0,
            ticksNeeded: 50,
            threads: 0,
            cost:0,
            costType:"",
            finish:function() { game.buyIce(10) },
            showing: function() { return true; }
        },
        { //Sell Water
            currentTicks: 0,
            ticksNeeded: 50,
            threads: 0,
            cost:0,
            costType:"",
            finish:function() { game.water.sellWater(5) },
            showing: function() { return true; }
        },
        { //Improve Farms
            currentTicks: 0,
            ticksNeeded: 40,
            threads: 0,
            cost:0,
            costType:"",
            finish:function() { game.farms.improve(); this.ticksNeeded = precision3(20*(this.completions+2 )+ Math.pow(this.completions, 2)/10); },
            showing: function() { return true; }
        },
        { //Find more Ice Sellers
            currentTicks: 0,
            ticksNeeded: 2000,
            threads: 0,
            cost: .5,
            costType:"cash",
            finish:function() { game.ice.findIceSeller(1) },
            showing: function() { return true; }
        },
        { //Bigger Storms
            currentTicks: 0,
            ticksNeeded: 600,
            threads: 0,
            cost: 2,
            costType:"science",
            finish:function() { game.clouds.gainStormDuration(5); this.cost += .5; this.ticksNeeded += 50; },
            done:function() { return game.clouds.initialStormDuration >= 300; },
            showing: function() { return true; }
        },
        { //Build Robots
            currentTicks: 0,
            ticksNeeded: 10000,
            threads: 0,
            cost:.01,
            costType:"metal",
            finish:function() { game.robots.gainRobots(1) },
            showing: function() { return game.robots.unlocked; },
            done:function() { return game.robots.robots >= game.robots.robotMax; }
        },
        { //More Robot Storage
            currentTicks: 0,
            ticksNeeded: 20000,
            threads: 0,
            cost:10,
            costType:"science",
            finish:function() { game.robots.gainStorage(5); this.cost = precision3(20*(this.completions+2 )+ Math.pow(this.completions, 2)); this.ticksNeeded+=2000; },
            showing: function() { return game.robots.unlocked; }
        },
        { //Improve House Design
            currentTicks: 0,
            ticksNeeded: 3000,
            threads: 0,
            cost:.5,
            costType:"wood",
            finish:function() { game.population.improveHouse(); this.ticksNeeded += 500; },
            showing: function() { return game.robots.unlocked; },
            done:function() { return this.completions >= 100; }
        }
    ];
}

//Not saved, keep parity with processes
var processesView = [
    {
        text:"优化土地",
        tooltip:"提高1％的未改良土地。<br>最大改善为（10x 基本陆地）<br>经过优化的百分比: <div id='landOptimized'></div>"
    },
    {
        text:"购买冰",
        tooltip:"最多可买10冰"
    },
    {
        text:"卖水",
        tooltip:"最多卖5水"
    },
    {
        text:"改良农场",
        tooltip:"农场效果提升 2%"
    },
    {
        text:"寻找更多冰卖家",
        tooltip:"获得200个可买冰以及每轮多1个"
    },
    {
        text:"更大的风暴",
        tooltip:"风暴时间延长5轮。 最大 300 持续时间。"
    },
    {
        text:"建造机器人",
        tooltip:"建造一个机器人"
    },
    {
        text:"更多的机器人上限",
        tooltip:"可持有机器人上限+5"
    },
    {
        text:"改善住宅设计",
        tooltip:"修改基础快乐值 .1"
    }
];