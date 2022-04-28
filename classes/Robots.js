function Robots() {
    this.robots = 0;
    this.robotsFree = 0;
    this.robotMax = 5;
    this.unlocked = 0;
    this.ore = 0;
    this.mines = 0;
    this.failed = 0;

    this.tick = function() {
        for(var i = 0; i < this.jobs.length; i++) {
            this.tickRow(this.jobs[i], this.jobs[i].workers);
        }
    };

    this.tickRow = function(row, ticksGained) {
        if(ticksGained === 0 || (row.done && row.done())) {
            row.isMoving = 0;
            return;
        }
        if(!row.ticksNeeded) { //No progress bar
            row.finish();
            return;
        }
        if(row.during && !row.during()) {
            row.isMoving = 0;
            return;
        }
        if(row.cost) {
            for(var i = 0; i < row.cost.length; i++) {
                var cost = ticksGained * row.cost[i];
                if (row.costType[i]) {
                    if (game[row.costType[i]] < cost) {
                        row.isMoving = 0;
                        return;
                    }
                }
            }
            for(i = 0; i < row.cost.length; i++) {
                game[row.costType[i]] -= ticksGained * row.cost[i];
            }
        }


        row.currentTicks += ticksGained;
        row.isMoving = 1;
        if (row.currentTicks >= row.ticksNeeded) {
            var overflow = row.currentTicks - row.ticksNeeded;
            row.currentTicks = 0;
            row.completions++;
            row.finish();
            this.tickRow(row, overflow); //recursive, but on the new cost
        }
    };

    this.gainRobots = function(amount) {
        this.robots += amount;
        this.robotsFree += amount;
        view.updateRobots();
    };

    this.gainStorage = function(amount) {
        this.robotMax += amount;
        view.updateRobots();
    };

    this.unlockRobots = function() {
        if(game.cash >= 3000) {
            game.cash -= 3000;
            this.unlocked = 1;
            view.checkRobotsUnlocked();
            this.gainRobots(1);
        }
        view.updateComputer();
        view.updateRobots();
    };

    this.failedRobots = function() {
        if(game.cash >= 1e6) {
            game.cash -= 1e6;
            this.failed = 0;
            view.checkRobotsUnlocked();
            this.gainRobots(1);
        }
        view.updateRobots();
    };

    this.addWorker = function(dataPos, numAdding) {
        if (this.robotsFree >= numAdding) {
            this.jobs[dataPos].workers += numAdding;
            this.robotsFree -= numAdding;
        }
        view.updateRobots();
    };
    this.removeWorker = function(dataPos, numRemoving) {
        if(this.jobs[dataPos].workers >= numRemoving) {
            this.jobs[dataPos].workers -= numRemoving;
            this.robotsFree += numRemoving;
        }
        view.updateRobots();
    };

    this.cutTrees = function(mult) {
        if(game.trees.trees >= 2 * mult) {
            game.trees.trees -= 2 * mult;
            game.wood += mult;
        }
    };

    this.mineOre = function(mult) {
        game.robots.ore += game.robots.mines / 100 * mult;
    };

    this.smeltOre = function(mult) {
        if(game.wood >= 5 * mult && this.ore >= mult && game.oxygen >= mult*1000) {
            game.wood -= 5 * mult;
            this.ore -= mult;
            game.oxygen -= 1000*mult;
            game.metal += mult;
        }
    };

    this.jobs = [
        { //Cut Trees
            workers:0,
            finish: function() { game.robots.cutTrees(this.workers); },
            showing: function() { return true; }
        },
        { //Expand indoor water storage
            currentTicks: 0,
            ticksNeeded: 3000,
            workers:0,
            cost:[.1],
            costType:["metal"],
            finish: function() { this.ticksNeeded += 1000; game.water.maxIndoor+= 50; },
            showing: function() { return true; }
        },
        { //Build Mines
            currentTicks: 0,
            ticksNeeded: 300,
            workers:0,
            cost:[1],
            costType:["wood"],
            finish: function() { game.robots.mines++; this.ticksNeeded += 30; this.cost[0] = precision3(.1 * this.completions + Math.pow(this.completions, 2)/500); },
            done: function() { return game.robots.mines*1000 >= game.land.optimizedLand; },
            showing: function() { return true; }
        },
        { //Mine Ore
            workers:0,
            finish: function() { game.robots.mineOre(this.workers); },
            showing: function() { return true; }
        },
        { //Smelt Ore
            workers:0,
            finish: function() { game.robots.smeltOre(this.workers); },
            showing: function() { return true; }
        },
        { //Turn ore into dirt
            currentTicks: 0,
            ticksNeeded: 1000,
            workers:0,
            during:function() {
                if(game.power >= 1 * this.workers && game.robots.ore >= this.workers * 1000) {
                    game.power -= 1 * this.workers;
                    game.robots.ore -= this.workers * 1000;
                    return true;
                }
                return false;
            },
            finish: function() { game.land.addLand(50); },
            showing: function() { return game.energy.unlocked; }
        }
    ];
}

var jobsView = [
    {
        text:"砍树",
        tooltip:"砍2棵树得到1个木头"
    },
    {
        text:"扩大室内储水量",
        tooltip:"最多可增加50个室内水。<br>成本增加1"
    },
    {
        text:"建造矿山",
        tooltip:"建造  (总陆地 / 1000) 矿山"
    },
    {
        text:"矿石",
        tooltip:"得到 (矿山 / 100) 矿石每轮"
    },
    {
        text:"冶炼矿石",
        tooltip:"每轮消耗5木头，1矿石，和1000氧气<br>得到1金属"
    },
    {
        text:"把矿石变成泥土",
        tooltip:"每轮消耗1能源和1000矿石<br>得到5基本陆地<br>获得的陆地总量: <div id='totalDirtFromOre'></div>"
    }
];