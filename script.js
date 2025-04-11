document.addEventListener('DOMContentLoaded', () => {
// Replace your current DOM element declarations with:
const addProcessBtn = document.getElementById('addProcessBtn');
const runSimulationBtn = document.getElementById('runSimulationBtn');
const resetBtn = document.getElementById('resetBtn');
const arrivalTimeInput = document.getElementById('arrivalTime');
const burstTimeInput = document.getElementById('burstTime');
const priorityInput = document.getElementById('priority');
const processTableBody = document.getElementById('processTableBody');
const ganttChart = document.getElementById('ganttChart');
const metricsDiv = document.getElementById('metrics');
const quantumContainer = document.getElementById('quantumContainer');
const timeQuantumInput = document.getElementById('timeQuantum');
const processMetricsBody = document.getElementById('processMetricsBody');

// Modified color input selection with null check
let processColorInput = document.getElementById('processColor');
if (!processColorInput) {
    console.warn("Process color input not found, creating fallback");
    processColorInput = document.createElement('input');
    processColorInput.type = 'color';
    processColorInput.value = '#3b82f6';
    document.body.appendChild(processColorInput);
}

    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            processColorInput.value = color;
        });
    });


    // Process management
    let processes = [];
    let nextPid = 1;
    
    // Keep track of selected algorithm
    let selectedAlgorithm = 'FCFS';
    
    // Event Listeners
    addProcessBtn.addEventListener('click', addProcess);
    runSimulationBtn.addEventListener('click', runSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    
    document.querySelectorAll('.algo-tab').forEach(tab => {
        tab.addEventListener('click', function() {
          // Remove active state from all tabs
          document.querySelectorAll('.algo-tab').forEach(t => {
            t.classList.remove('active', 'bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'text-white', 'shadow-sm');
            t.classList.add('bg-blue-100', 'hover:bg-blue-200', 'text-blue-800');
          });
          
          // Add active state to clicked tab
          this.classList.add('active', 'bg-gradient-to-r', 'from-blue-200', 'to-blue-300', 'text-white', 'shadow-sm');
          this.classList.remove('bg-blue-100', 'hover:bg-blue-200', 'text-blue-800');
          
          // Get selected algorithm
          selectedAlgorithm = this.dataset.algo;
          
          // Show time quantum only for Round Robin
          document.getElementById('quantumContainer').classList.toggle('hidden', selectedAlgorithm !== 'RR');
        });
      });
      
      // Initialize with FCFS selected
      document.querySelector('.algo-tab[data-algo="FCFS"]').click();

    
    // Functions
    function addProcess() {
        const arrivalTime = parseInt(arrivalTimeInput.value);
        const burstTime = parseInt(burstTimeInput.value);
        const priority = parseInt(priorityInput.value || 0);
        const color = processColorInput.value; // Use the stored reference
        
        // Validation
        if (isNaN(arrivalTime) || arrivalTime < 0) {
            alert('Please enter a valid arrival time (≥ 0)');
            return;
        }
        
        if (isNaN(burstTime) || burstTime <= 0) {
            alert('Please enter a valid burst time (> 0)');
            return;
        }
        
        if (isNaN(priority)) {
            alert('Please enter a valid priority number');
            return;
        }
    
        const pid = `P${nextPid++}`;
        processes.push(new Process(pid, arrivalTime, burstTime, priority, color));
        updateProcessTable();
        
        // Clear inputs but keep focus
        arrivalTimeInput.value = '';
        burstTimeInput.value = '';
        priorityInput.value = '0';
        arrivalTimeInput.focus();
    }
    
    function updateProcessTable() {
        processTableBody.innerHTML = '';
        
        processes.forEach(process => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td class="px-4 py-2 whitespace-nowrap">
                    <span class="inline-block w-3 h-3 rounded-full mr-2" style="background-color: ${process.color}"></span>
                    ${process.pid}
                </td>
                <td class="px-4 py-2 whitespace-nowrap">${process.arrivalTime}</td>
                <td class="px-4 py-2 whitespace-nowrap">${process.burstTime}</td>
                <td class="px-4 py-2 whitespace-nowrap">${process.priority}</td>
                <td class="px-4 py-2 whitespace-nowrap">
                    <button class="text-red-600 hover:text-red-900 remove-btn" data-pid="${process.pid}">
                        <i class="fas fa-trash-alt mr-1"></i> Remove
                    </button>
                </td>
            `;
            
            processTableBody.appendChild(row);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const pid = this.getAttribute('data-pid');
                processes = processes.filter(p => p.pid !== pid);
                updateProcessTable();
            });
        });
    }
    
    function runSimulation() {
        // Validate processes exist
        if (processes.length === 0) {
            alert('Please add at least one process');
            return;
        }
    
        // Show loading state
        ganttChart.innerHTML = `
            <div class="flex flex-col items-center justify-center h-48">
                <i class="fas fa-cog animate-spin text-blue-500 text-4xl mb-4"></i>
                <p class="text-gray-600">Simulating...</p>
            </div>
        `;
        metricsDiv.innerHTML = '<div class="text-center text-gray-500">Calculating metrics...</div>';
    
        // Run simulation after brief delay to ensure loading shows
        setTimeout(() => {
            try {
                let result;
                
                // Run selected algorithm
                switch (selectedAlgorithm) {
                    case 'FCFS':
                        result = {
                            segments: createSegmentsFromProcesses(fcfs([...processes])),
                            completedProcesses: fcfs([...processes])
                        };
                        break;
                    case 'SJF':
                        result = {
                            segments: createSegmentsFromProcesses(sjf([...processes])),
                            completedProcesses: sjf([...processes])
                        };
                        break;
                    case 'RR':
                        const timeQuantum = parseInt(timeQuantumInput.value);
                        if (isNaN(timeQuantum) || timeQuantum <= 0) {
                            throw new Error('Please enter a valid time quantum (> 0)');
                        }
                        
                        const processesForRR = processes.map(p => {
                            return new Process(p.pid, p.arrivalTime, p.burstTime, p.priority, p.color);
                        });
                        
                        result = roundRobin(processesForRR, timeQuantum);
                        break;
                    case 'Priority':
                        result = {
                            segments: createSegmentsFromProcesses(priorityScheduling([...processes])),
                            completedProcesses: priorityScheduling([...processes])
                        };
                        break;
                    default:
                        throw new Error('Invalid algorithm selected');
                }
    
                // Render results
                renderGanttChart(result.segments);
                renderMetrics(result.completedProcesses);

                setTimeout(() => {
                const ganttElement = document.getElementById('ganttChart');
                ganttElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 50);
                
            } catch (error) {
                // Handle errors gracefully
                ganttChart.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-48 text-red-500">
                        <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                        <p class="font-medium">${error.message}</p>
                    </div>
                `;
                metricsDiv.innerHTML = '<div class="text-center text-gray-500">Simulation failed</div>';
                console.error('Simulation error:', error);
            }
        }, 300);
    }
    
    function renderGanttChart(segments) {
        ganttChart.innerHTML = '';
        
        if (!segments || segments.length === 0) {
            ganttChart.innerHTML = '<div class="text-center text-gray-400 py-10">Gantt chart will appear here after simulation</div>';
            return;
        }
    
        const maxTime = Math.max(...segments.map(s => s.end));
        const containerWidth = ganttChart.clientWidth;
        const leftPadding = 20;
        const rightPadding = 20;
        const availableWidth = containerWidth - (leftPadding + rightPadding);
        const scale = availableWidth / Math.max(maxTime, 1);
        const barHeight = 40;
        const timelineHeight = 30;
    
        // Main container
        const container = document.createElement('div');
        container.className = 'relative mx-auto';
        container.style.width = '100%';
        container.style.minWidth = `${maxTime * scale + leftPadding + rightPadding}px`;
    
        // Process bars container
        const processContainer = document.createElement('div');
        processContainer.className = 'relative';
        processContainer.style.height = `${barHeight}px`;
        processContainer.style.marginBottom = '10px';
    
        // Timeline numbers container
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'flex relative h-6 mt-2';
    
        // Create a set to track which times we've already labeled to avoid duplicates
        const labeledTimes = new Set();
    
        segments.forEach(segment => {
            const left = leftPadding + (segment.start * scale);
            const width = segment.duration * scale;
            const minWidth = 24;
    
            // Process bar
            const bar = document.createElement('div');
            bar.className = 'absolute top-1/2 -translate-y-1/2 h-8 flex items-center justify-center text-xs font-bold rounded-sm shadow-md transition-all';
            bar.style.left = `${left}px`;
            bar.style.width = `${Math.max(width, minWidth)}px`;
            bar.style.minWidth = `${minWidth}px`;
    
            if (segment.type === 'idle') {
                bar.className += ' bg-gray-700 text-gray-300';
                bar.title = `Idle (${segment.start}-${segment.end})`;
                if (width > 30) bar.textContent = 'Idle';
            } else {
                bar.style.backgroundColor = segment.process.color;
                bar.style.color = getContrastColor(segment.process.color);
                bar.title = `${segment.process.pid} (${segment.start}-${segment.end})`;
                if (width > 30) bar.textContent = segment.process.pid;
            }
            processContainer.appendChild(bar);
    
            // Timeline number at the start of each segment (if not already labeled)
            if (!labeledTimes.has(segment.start)) {
                const timeLabel = document.createElement('div');
                timeLabel.className = 'absolute text-xs text-gray-400';
                timeLabel.style.left = `${left}px`;
                timeLabel.style.transform = 'translateX(-50%)';
                timeLabel.style.bottom = '0';
                timeLabel.textContent = segment.start;
                timelineContainer.appendChild(timeLabel);
                labeledTimes.add(segment.start);
            }
        });
    
        // Final end time label
        if (!labeledTimes.has(maxTime)) {
            const endLabel = document.createElement('div');
            endLabel.className = 'absolute text-xs text-gray-400';
            endLabel.style.left = `${leftPadding + (maxTime * scale)}px`;
            endLabel.style.transform = 'translateX(-50%)';
            endLabel.style.bottom = '0';
            endLabel.textContent = maxTime;
            timelineContainer.appendChild(endLabel);
        }
    
        function getContrastColor(hexColor) {
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5 ? '#000000' : '#ffffff';
        }
    
        // Assemble components
        container.appendChild(processContainer);
        container.appendChild(timelineContainer);
        ganttChart.appendChild(container);
    
        // Auto-scroll to chart
        setTimeout(() => {
            ganttChart.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }
    
    function createSegmentsFromProcesses(processes) {
        const sortedProcesses = [...processes].sort((a, b) => a.startTime - b.startTime);
        const segments = [];
        let currentTime = 0;
        
        sortedProcesses.forEach(process => {
            // Add idle time if there's a gap
            if (currentTime < process.startTime) {
                segments.push({
                    type: 'idle',
                    start: currentTime,
                    end: process.startTime,
                    duration: process.startTime - currentTime
                });
            }
            
            // Add process execution
            segments.push({
                process: process,
                start: process.startTime,
                end: process.endTime,
                duration: process.endTime - process.startTime
            });
            
            currentTime = process.endTime;
        });
        
        return segments;
    }
    
    
    
    function renderMetrics(processes) {
        if (processes.length === 0) {
            metricsDiv.innerHTML = '<div class="text-center text-gray-500">No metrics available</div>';
            processMetricsBody.innerHTML = '';
            return;
        }
    
        const totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
        const totalTurnaroundTime = processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
        const avgWaitingTime = totalWaitingTime / processes.length;
        const avgTurnaroundTime = totalTurnaroundTime / processes.length;
    
        // Calculate throughput (processes per unit time)
        const lastCompletionTime = Math.max(...processes.map(p => p.endTime));
        const throughput = processes.length / lastCompletionTime;
    
        // Update metrics section
        metricsDiv.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Avg Waiting Time Card -->
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-900/30 text-blue-400 mr-4">
                                <i class="fas fa-hourglass-half text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-medium text-blue-300">Avg. Waiting Time</h3>
                                <p class="text-2xl font-bold text-white">${avgWaitingTime.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Avg Turnaround Time Card -->
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-900/30 text-blue-400 mr-4">
                                <i class="fas fa-exchange-alt text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-medium text-blue-300">Avg. Turnaround Time</h3>
                                <p class="text-2xl font-bold text-white">${avgTurnaroundTime.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Throughput Card -->
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-900/30 text-blue-400 mr-4">
                                <i class="fas fa-tachometer-alt text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-medium text-blue-300">Throughput</h3>
                                <p class="text-2xl font-bold text-white">${throughput.toFixed(4)}</p>
                                <p class="text-xs text-blue-400">processes/time unit</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Performance Summary Card -->
                <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h3 class="text-lg font-semibold text-blue-300 mb-4 flex items-center">
                        <i class="fas fa-chart-line mr-2 text-blue-400"></i> Performance Summary
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="metric-item">
                            <h4 class="text-sm font-medium text-blue-300 mb-1">Total Waiting Time</h4>
                            <p class="text-xl font-bold text-white">${totalWaitingTime}</p>
                        </div>
                        <div class="metric-item">
                            <h4 class="text-sm font-medium text-blue-300 mb-1">Total Turnaround Time</h4>
                            <p class="text-xl font-bold text-white">${totalTurnaroundTime}</p>
                        </div>
                        <div class="metric-item">
                            <h4 class="text-sm font-medium text-blue-300 mb-1">Total Processes</h4>
                            <p class="text-xl font-bold text-white">${processes.length}</p>
                        </div>
                        <div class="metric-item">
                            <h4 class="text-sm font-medium text-blue-300 mb-1">Completion Time</h4>
                            <p class="text-xl font-bold text-white">${lastCompletionTime}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    
        // Update process metrics table
        processMetricsBody.innerHTML = processes.map(p => `
            <tr class="hover:bg-blue-50 transition-colors">
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="inline-block w-3 h-3 rounded-full mr-2" style="background-color: ${p.color}"></span>
                    <span class="font-medium">${p.pid}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap ${p.waitingTime > avgWaitingTime ? 'text-red-500' : 'text-green-500'}">
                    ${p.waitingTime} ${p.waitingTime > avgWaitingTime ? '↑' : '↓'}
                </td>
                <td class="px-4 py-3 whitespace-nowrap ${p.turnaroundTime > avgTurnaroundTime ? 'text-red-500' : 'text-green-500'}">
                    ${p.turnaroundTime} ${p.turnaroundTime > avgTurnaroundTime ? '↑' : '↓'}
                </td>
            </tr>
        `).join('');
    }
    
    function resetSimulation() {
        processes = [];
        nextPid = 1;
        updateProcessTable();
        ganttChart.innerHTML = '<div class="text-center text-gray-500">Gantt chart will appear here after simulation</div>';
        metricsDiv.innerHTML = '<div class="text-center text-gray-500">Metrics will appear here after simulation</div>';
        processMetricsBody.innerHTML = '';
    }
    
});