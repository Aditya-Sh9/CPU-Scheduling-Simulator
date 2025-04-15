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

function sjf(processes, isPreemptive = false) {
    processes = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    const readyQueue = [];
    const completed = [];
    const executionSegments = [];
    
    while (processes.length > 0 || readyQueue.length > 0) {
        // Add arrived processes to ready queue
        while (processes.length > 0 && processes[0].arrivalTime <= currentTime) {
            const process = processes.shift();
            readyQueue.push(new Process(
                process.pid,
                process.arrivalTime,
                process.burstTime,
                process.priority,
                process.color
            ));
        }
        
        if (readyQueue.length > 0) {
            // Sort by remaining time (SJF)
            readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);
            const current = readyQueue[0];
            
            if (isPreemptive) {
                // Find next arrival time that might preempt
                let nextArrival = processes.length > 0 ? processes[0].arrivalTime : Infinity;
                
                // Execute until completion or next arrival
                const execTime = Math.min(
                    current.remainingTime,
                    nextArrival - currentTime
                );
                
                // Mark start time if not already set
                if (current.startTime === undefined) {
                    current.startTime = currentTime;
                }
                
                executionSegments.push({
                    process: current,
                    start: currentTime,
                    end: currentTime + execTime,
                    duration: execTime
                });
                
                current.remainingTime -= execTime;
                currentTime += execTime;
                
                // Check if process completed
                if (current.remainingTime <= 0) {
                    current.endTime = currentTime;
                    current.turnaroundTime = current.endTime - current.arrivalTime;
                    current.waitingTime = current.turnaroundTime - current.burstTime;
                    completed.push(readyQueue.shift());
                }
            } else {
                // Non-preemptive - execute entire burst time
                current.startTime = currentTime;
                current.endTime = currentTime + current.burstTime;
                current.turnaroundTime = current.endTime - current.arrivalTime;
                current.waitingTime = current.startTime - current.arrivalTime;
                
                executionSegments.push({
                    process: current,
                    start: currentTime,
                    end: current.endTime,
                    duration: current.burstTime
                });
                
                currentTime = current.endTime;
                completed.push(readyQueue.shift());
            }
        } else {
            // CPU idle time
            const idleTime = processes[0].arrivalTime - currentTime;
            executionSegments.push({
                type: 'idle',
                start: currentTime,
                end: processes[0].arrivalTime,
                duration: idleTime
            });
            currentTime = processes[0].arrivalTime;
        }
    }
    
    return {
        segments: executionSegments,
        completedProcesses: completed
    };
}

function roundRobin(processes, timeQuantum) {
    processes = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    const queue = [];
    let currentTime = 0;
    const completed = [];
    const executionSegments = [];
    
    while (processes.length > 0 || queue.length > 0) {
        // Add arrived processes to queue
        while (processes.length > 0 && processes[0].arrivalTime <= currentTime) {
            queue.push(processes.shift());
        }
        
        if (queue.length > 0) {
            const current = queue.shift();
            
            // Mark start time if not already set
            if (current.startTime === undefined) {
                current.startTime = currentTime;
            }
            
            // Execute for time quantum or remaining time
            const execTime = Math.min(timeQuantum, current.remainingTime);
            executionSegments.push({
                process: current,
                start: currentTime,
                end: currentTime + execTime,
                duration: execTime
            });
            
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
        } else if (processes.length > 0) {
            // CPU idle time
            executionSegments.push({
                type: 'idle',
                start: currentTime,
                end: processes[0].arrivalTime,
                duration: processes[0].arrivalTime - currentTime
            });
            currentTime = processes[0].arrivalTime;
        }
    }
    
    return {
        segments: executionSegments,
        completedProcesses: completed
    };
}

function priorityScheduling(processes, isPreemptive = false) {
    // Lower number means higher priority
    processes = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.priority - b.priority);
    let currentTime = 0;
    const readyQueue = [];
    const completed = [];
    const executionSegments = [];
    
    while (processes.length > 0 || readyQueue.length > 0) {
        // Add arrived processes to ready queue
        while (processes.length > 0 && processes[0].arrivalTime <= currentTime) {
            const process = processes.shift();
            readyQueue.push(new Process(
                process.pid,
                process.arrivalTime,
                process.burstTime,
                process.priority,
                process.color
            ));
        }
        
        if (readyQueue.length > 0) {
            // Sort by priority (lower number = higher priority)
            readyQueue.sort((a, b) => a.priority - b.priority);
            const current = readyQueue[0];
            
            if (isPreemptive) {
                // Find next arrival time that might preempt
                let nextArrival = processes.length > 0 ? processes[0].arrivalTime : Infinity;
                
                // Execute until completion or next arrival
                const execTime = Math.min(
                    current.remainingTime,
                    nextArrival - currentTime
                );
                
                // Mark start time if not already set
                if (current.startTime === undefined) {
                    current.startTime = currentTime;
                }
                
                executionSegments.push({
                    process: current,
                    start: currentTime,
                    end: currentTime + execTime,
                    duration: execTime
                });
                
                current.remainingTime -= execTime;
                currentTime += execTime;
                
                // Check if process completed
                if (current.remainingTime <= 0) {
                    current.endTime = currentTime;
                    current.turnaroundTime = current.endTime - current.arrivalTime;
                    current.waitingTime = current.turnaroundTime - current.burstTime;
                    completed.push(readyQueue.shift());
                }
            } else {
                // Non-preemptive - execute entire burst time
                current.startTime = currentTime;
                current.endTime = currentTime + current.burstTime;
                current.turnaroundTime = current.endTime - current.arrivalTime;
                current.waitingTime = current.startTime - current.arrivalTime;
                
                executionSegments.push({
                    process: current,
                    start: currentTime,
                    end: current.endTime,
                    duration: current.burstTime
                });
                
                currentTime = current.endTime;
                completed.push(readyQueue.shift());
            }
        } else {
            // CPU idle time
            const idleTime = processes[0].arrivalTime - currentTime;
            executionSegments.push({
                type: 'idle',
                start: currentTime,
                end: processes[0].arrivalTime,
                duration: idleTime
            });
            currentTime = processes[0].arrivalTime;
        }
    }
    
    return {
        segments: executionSegments,
        completedProcesses: completed
    };
}