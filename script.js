document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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
    
    // Process management
    let processes = [];
    let nextPid = 1;
    
    // Algorithm radio buttons
    const algorithmRadios = document.querySelectorAll('input[name="algorithm"]');
    
    // Event Listeners
    addProcessBtn.addEventListener('click', addProcess);
    runSimulationBtn.addEventListener('click', runSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    
    // Show/hide time quantum input for Round Robin
    algorithmRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            quantumContainer.classList.toggle('hidden', radio.value !== 'RR');
        });
    });
    
    // Functions
    function addProcess() {
        const arrivalTime = parseInt(arrivalTimeInput.value);
        const burstTime = parseInt(burstTimeInput.value);
        const priority = parseInt(priorityInput.value);
        
        if (isNaN(arrivalTime) || isNaN(burstTime) || isNaN(priority)) {
            alert('Please enter valid numbers for all fields');
            return;
        }
        
        if (burstTime <= 0) {
            alert('Burst time must be greater than 0');
            return;
        }
        
        const pid = `P${nextPid++}`;
        const process = new Process(pid, arrivalTime, burstTime, priority);
        processes.push(process);
        
        updateProcessTable();
        
        // Clear inputs
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
                <td class="px-4 py-2 whitespace-nowrap">${process.pid}</td>
                <td class="px-4 py-2 whitespace-nowrap">${process.arrivalTime}</td>
                <td class="px-4 py-2 whitespace-nowrap">${process.burstTime}</td>
                <td class="px-4 py-2 whitespace-nowrap">${process.priority}</td>
                <td class="px-4 py-2 whitespace-nowrap">
                    <button class="text-red-600 hover:text-red-900 remove-btn" data-pid="${process.pid}">
                        Remove
                    </button>
                </td>
            `;
            
            processTableBody.appendChild(row);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pid = e.target.getAttribute('data-pid');
                processes = processes.filter(p => p.pid !== pid);
                updateProcessTable();
            });
        });
    }
    
    function runSimulation() {
        if (processes.length === 0) {
            alert('Please add at least one process');
            return;
        }
        
        const selectedAlgorithm = document.querySelector('input[name="algorithm"]:checked').value;
        let scheduledProcesses = [];
        
        switch (selectedAlgorithm) {
            case 'FCFS':
                scheduledProcesses = fcfs(processes);
                break;
            case 'SJF':
                scheduledProcesses = sjf(processes);
                break;
            case 'RR':
                const timeQuantum = parseInt(timeQuantumInput.value);
                if (isNaN(timeQuantum)){
                    alert('Please enter a valid time quantum');
                    return;
                }
                scheduledProcesses = roundRobin(processes, timeQuantum);
                break;
            case 'Priority':
                scheduledProcesses = priorityScheduling(processes);
                break;
        }
        
        renderGanttChart(scheduledProcesses);
        renderMetrics(scheduledProcesses);
    }
    
    function renderGanttChart(processes) {
        if (processes.length === 0) return;
        
        const maxTime = Math.max(...processes.map(p => p.endTime));
        const containerWidth = ganttChart.clientWidth - 40;
        const scale = containerWidth / maxTime;
        
        let ganttHtml = `
            <div class="flex items-end h-48 mb-4 relative">
                <div class="absolute bottom-0 left-0 right-0 h-px bg-gray-300"></div>
        `;
        
        // Add timeline markers
        for (let t = 0; t <= maxTime; t++) {
            const left = t * scale;
            ganttHtml += `
                <div class="absolute bottom-0 h-2 w-px bg-gray-400" style="left: ${left}px;"></div>
                <div class="absolute bottom-2 text-xs text-gray-600" style="left: ${left}px; transform: translateX(-50%);">${t}</div>
            `;
        }
        
        // Add process bars
        processes.forEach((process, index) => {
            const left = process.startTime * scale;
            const width = (process.endTime - process.startTime) * scale;
            const top = 20 + (index % 4) * 30;
            const color = getProcessColor(process.pid);
            
            ganttHtml += `
                <div class="absolute flex flex-col items-center" style="left: ${left}px; width: ${width}px; top: ${top}px;">
                    <div class="h-6 ${color} rounded-md flex items-center justify-center text-white text-xs font-medium w-full">
                        ${process.pid}
                    </div>
                    <div class="text-xs mt-1">
                        ${process.startTime}-${process.endTime}
                    </div>
                </div>
            `;
        });
        
        ganttHtml += `</div>`;
        ganttChart.innerHTML = ganttHtml;
    }
    
    function getProcessColor(pid) {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        const pidNum = parseInt(pid.substring(1)) || 0;
        return colors[pidNum % colors.length];
    }
    
    function renderMetrics(processes) {
        if (processes.length === 0) return;
        
        const totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
        const totalTurnaroundTime = processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
        const avgWaitingTime = totalWaitingTime / processes.length;
        const avgTurnaroundTime = totalTurnaroundTime / processes.length;
        
        let metricsHtml = `
            <div class="space-y-4">
                <div>
                    <h3 class="font-medium text-gray-700">Average Waiting Time</h3>
                    <p class="text-2xl font-bold text-blue-600">${avgWaitingTime.toFixed(2)}</p>
                </div>
                <div>
                    <h3 class="font-medium text-gray-700">Average Turnaround Time</h3>
                    <p class="text-2xl font-bold text-green-600">${avgTurnaroundTime.toFixed(2)}</p>
                </div>
                
                <div class="mt-6">
                    <h3 class="font-medium text-gray-700 mb-2">Individual Process Metrics</h3>
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PID</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Waiting Time</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Turnaround Time</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        processes.forEach(process => {
            metricsHtml += `
                <tr>
                    <td class="px-4 py-2 whitespace-nowrap">${process.pid}</td>
                    <td class="px-4 py-2 whitespace-nowrap">${process.waitingTime}</td>
                    <td class="px-4 py-2 whitespace-nowrap">${process.turnaroundTime}</td>
                </tr>
            `;
        });
        
        metricsHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        metricsDiv.innerHTML = metricsHtml;
    }
    
    function resetSimulation() {
        processes = [];
        nextPid = 1;
        updateProcessTable();
        ganttChart.innerHTML = '<div class="text-center text-gray-500">Gantt chart will appear here after simulation</div>';
        metricsDiv.innerHTML = '<div class="text-center text-gray-500">Metrics will appear here after simulation</div>';
    }
});