class Process {
    constructor(pid, arrivalTime, burstTime, priority) {
        this.pid = pid;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.remainingTime = burstTime;
        this.priority = priority;
        this.waitingTime = 0;
        this.turnaroundTime = 0;
        this.startTime = -1;
        this.endTime = -1;
    }
}