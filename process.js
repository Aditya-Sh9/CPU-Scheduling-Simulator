class Process {
    constructor(pid, arrivalTime, burstTime, priority, color = '#3b82f6') {
        this.pid = pid;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.remainingTime = burstTime;
        this.priority = priority;
        this.color = color;  // Add color property
        this.waitingTime = 0;
        this.turnaroundTime = 0;
        this.startTime = -1;
        this.endTime = -1;
    }
}