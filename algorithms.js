function fcfs(processes) {
    processes = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    
    for (const process of processes) {
        if (currentTime < process.arrivalTime) {
            currentTime = process.arrivalTime;
        }
        
        process.startTime = currentTime;
        process.endTime = currentTime + process.burstTime;
        process.turnaroundTime = process.endTime - process.arrivalTime;
        process.waitingTime = process.startTime - process.arrivalTime;
        
        currentTime = process.endTime;
    }
    
    return processes;
}

function sjf(processes) {
    processes = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    const readyQueue = [];
    const completed = [];
    
    while (processes.length > 0 || readyQueue.length > 0) {
        // Add arrived processes to ready queue
        while (processes.length > 0 && processes[0].arrivalTime <= currentTime) {
            readyQueue.push(processes.shift());
        }
        
        if (readyQueue.length > 0) {
            // Sort by burst time (SJF)
            readyQueue.sort((a, b) => a.burstTime - b.burstTime);
            const current = readyQueue.shift();
            
            current.startTime = currentTime;
            current.endTime = currentTime + current.burstTime;
            current.turnaroundTime = current.endTime - current.arrivalTime;
            current.waitingTime = current.startTime - current.arrivalTime;
            
            currentTime = current.endTime;
            completed.push(current);
        } else {
            // CPU idle time
            currentTime = processes[0].arrivalTime;
        }
    }
    
    return completed;
}

function roundRobin(processes, timeQuantum) {
    processes = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    const queue = [];
    let currentTime = 0;
    const completed = [];
    
    while (processes.length > 0 || queue.length > 0) {
        // Add arrived processes to queue
        while (processes.length > 0 && processes[0].arrivalTime <= currentTime) {
            queue.push(processes.shift());
        }
        
        if (queue.length > 0) {
            const current = queue.shift();
            
            // Mark start time if not already set
            if (current.startTime === -1) {
                current.startTime = currentTime;
            }
            
            // Execute for time quantum or remaining time
            const execTime = Math.min(timeQuantum, current.remainingTime);
            current.remainingTime -= execTime;
            currentTime += execTime;
            
            // Add arrived processes during this execution
            while (processes.length > 0 && processes[0].arrivalTime <= currentTime) {
                queue.push(processes.shift());
            }
            
            if (current.remainingTime > 0) {
                queue.push(current);
            } else {
                current.endTime = currentTime;
                current.turnaroundTime = current.endTime - current.arrivalTime;
                current.waitingTime = current.turnaroundTime - current.burstTime;
                completed.push(current);
            }
        } else {
            // CPU idle time
            currentTime = processes[0].arrivalTime;
        }
    }
    
    return completed;
}

function priorityScheduling(processes) {
    // Lower number means higher priority
    processes = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.priority - b.priority);
    let currentTime = 0;
    const readyQueue = [];
    const completed = [];
    
    while (processes.length > 0 || readyQueue.length > 0) {
        // Add arrived processes to ready queue
        while (processes.length > 0 && processes[0].arrivalTime <= currentTime) {
            readyQueue.push(processes.shift());
        }
        
        if (readyQueue.length > 0) {
            // Sort by priority (lower number = higher priority)
            readyQueue.sort((a, b) => a.priority - b.priority);
            const current = readyQueue.shift();
            
            current.startTime = currentTime;
            current.endTime = currentTime + current.burstTime;
            current.turnaroundTime = current.endTime - current.arrivalTime;
            current.waitingTime = current.startTime - current.arrivalTime;
            
            currentTime = current.endTime;
            completed.push(current);
        } else {
            // CPU idle time
            currentTime = processes[0].arrivalTime;
        }
    }
    
    return completed;
}