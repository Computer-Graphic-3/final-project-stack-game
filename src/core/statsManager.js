export class StatsManager {
    constructor() {
        this.stats = this.loadStats();
        this.currentGameStats = this.initializeGameStats();
    }

    loadStats() {
        const saved = localStorage.getItem('stackGameStats');
        if (saved) {
            const loadedStats = JSON.parse(saved);
            return {
                gamesStarted: loadedStats.gamesStarted || 0,
                gamesEnded: loadedStats.gamesEnded || 0,
                totalScore: loadedStats.totalScore || 0,
                highScore: loadedStats.highScore || 0,
                beatenHighScore: loadedStats.beatenHighScore || 0,
                longestCombo: loadedStats.longestCombo || 0,
                perfects: loadedStats.perfects || 0,
                cutTiles: loadedStats.cutTiles || 0,
                totalErrorPercentage: loadedStats.totalErrorPercentage || 0,
                bestErrorPercentage: loadedStats.bestErrorPercentage || 100,
                bestPerfectPercentage: loadedStats.bestPerfectPercentage || 0,
                totalGames: loadedStats.totalGames || 0,
                totalPlayTime: loadedStats.totalPlayTime || 0,
                focusIndexHistory: loadedStats.focusIndexHistory || [],
                bestFocusIndex: loadedStats.bestFocusIndex || 0
            };
        }
        
        return {
            gamesStarted: 0,
            gamesEnded: 0,
            totalScore: 0,
            highScore: 0,
            beatenHighScore: 0,
            longestCombo: 0,
            perfects: 0,
            cutTiles: 0,
            totalErrorPercentage: 0,
            bestErrorPercentage: 100,
            bestPerfectPercentage: 0,
            totalGames: 0,
            totalPlayTime: 0,
            focusIndexHistory: [],
            bestFocusIndex: 0
        };
    }

    saveStats() {
        localStorage.setItem('stackGameStats', JSON.stringify(this.stats));
    }

    initializeGameStats() {
        return {
            score: 0,
            combo: 0,
            perfects: 0,
            errors: [],
            timingErrors: [],
            alignmentOffsets: [],
            startTime: Date.now(),
            endTime: null,
            clickTimes: [],
            focusIndex: 0
        };
    }

    startGame() {
        this.stats.gamesStarted++;
        this.currentGameStats = this.initializeGameStats();
        this.currentGameStats.startTime = Date.now();
        this.saveStats();
    }

    endGame() {
        this.stats.gamesEnded++;
        this.currentGameStats.endTime = Date.now();
        
        this.stats.totalScore += this.currentGameStats.score;
        
        if (this.currentGameStats.score > this.stats.highScore) {
            this.stats.beatenHighScore++;
            this.stats.highScore = this.currentGameStats.score;
        }
        if (this.currentGameStats.combo > this.stats.longestCombo) {
            this.stats.longestCombo = this.currentGameStats.combo;
        }
        
        this.stats.perfects += this.currentGameStats.perfects;
        this.stats.cutTiles += this.currentGameStats.score;
        
        const gameErrorPercentage = this.calculateCurrentGameErrorPercentage();
        this.stats.totalErrorPercentage += gameErrorPercentage;
        
        if (gameErrorPercentage < this.stats.bestErrorPercentage && gameErrorPercentage > 0) {
            this.stats.bestErrorPercentage = gameErrorPercentage;
        }
        
        const perfectPercentage = this.calculateCurrentGamePerfectPercentage();
        if (perfectPercentage > this.stats.bestPerfectPercentage) {
            this.stats.bestPerfectPercentage = perfectPercentage;
        }
        
        this.currentGameStats.focusIndex = this.calculateFocusIndex();
        
        if (!this.stats.focusIndexHistory) {
            this.stats.focusIndexHistory = [];
        }
        
        this.stats.focusIndexHistory.push(this.currentGameStats.focusIndex);
        
        if (this.currentGameStats.focusIndex > this.stats.bestFocusIndex) {
            this.stats.bestFocusIndex = this.currentGameStats.focusIndex;
        }
        
        this.stats.totalPlayTime += (this.currentGameStats.endTime - this.currentGameStats.startTime);
        this.stats.totalGames++;
        
        this.saveStats();
    }

    addScore() {
        this.currentGameStats.score++;
        this.currentGameStats.combo++;
        
        if (!this.currentGameStats.clickTimes) this.currentGameStats.clickTimes = [];
        this.currentGameStats.clickTimes.push(Date.now());
    }

    addPerfect() {
        this.currentGameStats.perfects++;
    }

    addError(errorPercentage, timingError, alignmentOffset) {
        if (!this.currentGameStats.errors) this.currentGameStats.errors = [];
        if (!this.currentGameStats.timingErrors) this.currentGameStats.timingErrors = [];
        if (!this.currentGameStats.alignmentOffsets) this.currentGameStats.alignmentOffsets = [];
        
        this.currentGameStats.errors.push(errorPercentage);
        this.currentGameStats.timingErrors.push(timingError);
        this.currentGameStats.alignmentOffsets.push(alignmentOffset);
    }

    resetCombo() {
        this.currentGameStats.combo = 0;
    }

    calculateCurrentGameErrorPercentage() {
        if (!this.currentGameStats.errors || this.currentGameStats.errors.length === 0) return 0;
        const sum = this.currentGameStats.errors.reduce((a, b) => a + b, 0);
        return sum / this.currentGameStats.errors.length;
    }

    calculateCurrentGamePerfectPercentage() {
        if (this.currentGameStats.score === 0) return 0;
        return (this.currentGameStats.perfects / this.currentGameStats.score) * 100;
    }

    calculateAverageErrorPercentage() {
        if (this.stats.totalGames === 0) return 0;
        return this.stats.totalErrorPercentage / this.stats.totalGames;
    }

    calculateCPM() {
        const gameTime = (this.currentGameStats.endTime - this.currentGameStats.startTime) / 1000 / 60; 
        if (gameTime === 0) return 0;
        return this.currentGameStats.score / gameTime;
    }

    calculateFocusIndex() {
        const score = this.currentGameStats.score;
        const perfectPercentage = this.calculateCurrentGamePerfectPercentage();
        const errorPercentage = this.calculateCurrentGameErrorPercentage();
        const cpm = this.calculateCPM();
        const combo = this.currentGameStats.combo;
        
        const avgScore = 10; 
        const avgPerfectPercentage = 20;
        const avgErrorPercentage = 30;
        const avgCPM = 15; 
        const avgCombo = 5; 
        
        const scoreNorm = Math.min(score / (avgScore * 2), 1);
        const perfectNorm = Math.min(perfectPercentage / (avgPerfectPercentage * 2), 1);
        const errorNorm = Math.max(0, 1 - (errorPercentage / avgErrorPercentage));
        const cpmNorm = Math.min(cpm / (avgCPM * 2), 1);
        const comboNorm = Math.min(combo / (avgCombo * 2), 1);
        
        const focusIndex = (
            scoreNorm * 0.3 +         
            perfectNorm * 0.25 +       
            errorNorm * 0.25 +    
            cpmNorm * 0.1 +            
            comboNorm * 0.1            
        ) * 100;
        
        return Math.round(Math.min(100, Math.max(0, focusIndex)));
    }

    getGameSummary() {
        const currentCombo = this.currentGameStats.combo || 0;
        const isComboRecord = currentCombo > this.stats.longestCombo;
        const perfectPercentage = this.calculateCurrentGamePerfectPercentage();
        const errorPercentage = this.calculateCurrentGameErrorPercentage();
        const cpm = this.calculateCPM();
        const focusIndex = this.currentGameStats.focusIndex || this.calculateFocusIndex();
        
        const timingErrors = this.currentGameStats.timingErrors || [];
        const alignmentOffsets = this.currentGameStats.alignmentOffsets || [];
        
        return {
            longestCombo: {
                current: currentCombo,
                isRecord: isComboRecord,
                previous: this.stats.longestCombo
            },
            perfectPercentage: {
                current: perfectPercentage,
                best: this.stats.bestPerfectPercentage
            },
            errorPercentage: {
                current: errorPercentage,
                best: this.stats.bestErrorPercentage
            },
            totalGames: this.stats.totalGames + 1,
            cpm: cpm,
            focusIndex: focusIndex,
            timingErrorAvg: timingErrors.length > 0 
                ? timingErrors.reduce((a, b) => a + b, 0) / timingErrors.length 
                : 0,
            alignmentOffsetAvg: alignmentOffsets.length > 0
                ? alignmentOffsets.reduce((a, b) => a + b, 0) / alignmentOffsets.length
                : 0,
            streak: currentCombo
        };
    }

    getAllTimeStats() {
        const focusHistory = this.stats.focusIndexHistory || [];
        
        return {
            gamesPlayed: this.stats.totalGames,
            highScore: this.stats.highScore,
            totalScore: this.stats.totalScore,
            averageScore: this.stats.totalGames > 0 ? this.stats.totalScore / this.stats.totalGames : 0,
            longestCombo: this.stats.longestCombo,
            totalPerfects: this.stats.perfects,
            averageErrorPercentage: this.calculateAverageErrorPercentage(),
            bestErrorPercentage: this.stats.bestErrorPercentage,
            bestPerfectPercentage: this.stats.bestPerfectPercentage,
            totalPlayTime: this.stats.totalPlayTime,
            averageFocusIndex: focusHistory.length > 0 
                ? focusHistory.reduce((a, b) => a + b, 0) / focusHistory.length 
                : 0,
            bestFocusIndex: this.stats.bestFocusIndex
        };
    }
}