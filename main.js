import { Chart } from 'chart.js/auto';

// Constants
const SIMULATION_STEP = 1; // minute
const MAX_CHARGE_RATE = 11; // kW

// Initialize charts
const enodeCtx = document.getElementById('enodeChart').getContext('2d');
const realtimeCtx = document.getElementById('realtimeChart').getContext('2d');
const enodePieCtx = document.getElementById('enodePieChart').getContext('2d');
const realtimePieCtx = document.getElementById('realtimePieChart').getContext('2d');
const enodeEnergyBarCtx = document.getElementById('enodeEnergyBarChart').getContext('2d');
const realtimeEnergyBarCtx = document.getElementById('realtimeEnergyBarChart').getContext('2d');
const enodeCostBarCtx = document.getElementById('enodeCostBarChart').getContext('2d');
const realtimeCostBarCtx = document.getElementById('realtimeCostBarChart').getContext('2d');

const chartConfig = {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Solar Production',
        data: [],
        borderColor: 'rgb(255, 205, 86)',
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0
      },
      {
        label: 'Grid Import',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0
      },
      {
        label: 'Grid Export',
        data: [],
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0
      },
      {
        label: 'Charging Rate',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Power (kW)'
        },
        suggestedMax: 11
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    }
  }
};

const pieChartConfig = {
  type: 'pie',
  data: {
    labels: ['Solar Energy Used', 'Grid Energy Used', 'Solar Exported'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: [
        'rgb(255, 205, 86)',  // Solar used - yellow
        'rgb(255, 99, 132)',  // Grid used - red
        'rgb(54, 162, 235)'   // Solar exported - blue
      ]
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Energy Source Breakdown'
      }
    }
  }
};

const energyBarConfig = {
  type: 'bar',
  data: {
    labels: ['Energy Breakdown'],
    datasets: [
      {
        label: 'Solar Energy Used',
        data: [0],
        backgroundColor: 'rgb(255, 205, 86)',
        stack: 'Stack 0'
      },
      {
        label: 'Grid Energy Used',
        data: [0],
        backgroundColor: 'rgb(255, 99, 132)',
        stack: 'Stack 0'
      },
      {
        label: 'Solar Exported',
        data: [0],
        backgroundColor: 'rgb(54, 162, 235)',
        stack: 'Stack 0'
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Energy (kWh)'
        },
        suggestedMax: 5
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Energy Source Breakdown'
      }
    }
  }
};

const costBarConfig = {
  type: 'bar',
  data: {
    labels: ['Cost Breakdown'],
    datasets: [
      {
        label: 'Solar Energy Cost',
        data: [0],
        backgroundColor: 'rgb(255, 205, 86)',
        stack: 'Stack 0'
      },
      {
        label: 'Grid Energy Cost',
        data: [0],
        backgroundColor: 'rgb(255, 99, 132)',
        stack: 'Stack 0'
      },
      {
        label: 'Export Earnings',
        data: [0],
        backgroundColor: 'rgb(54, 162, 235)',
        stack: 'Stack 0'
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Cost (€)'
        },
        suggestedMax: 2
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Cost Breakdown'
      }
    }
  }
};

let enodeChart = new Chart(enodeCtx, chartConfig);
let realtimeChart = new Chart(realtimeCtx, chartConfig);
let enodePieChart = new Chart(enodePieCtx, pieChartConfig);
let realtimePieChart = new Chart(realtimePieCtx, pieChartConfig);
let enodeEnergyBarChart = new Chart(enodeEnergyBarCtx, energyBarConfig);
let realtimeEnergyBarChart = new Chart(realtimeEnergyBarCtx, energyBarConfig);
let enodeCostBarChart = new Chart(enodeCostBarCtx, costBarConfig);
let realtimeCostBarChart = new Chart(realtimeCostBarCtx, costBarConfig);

// Solar production model
function calculateSolarProduction(hour, minute, weather) {
  // Constants for solar curve
  const sunriseHour = 6; // 6 AM
  const sunsetHour = 18; // 6 PM
  const maxProduction = 10; // 10kW peak
  
  // Convert hour and minute to decimal hours (e.g., 14:30 becomes 14.5)
  const exactHour = hour + (minute / 60);
  
  // Calculate the normalized hour (0-1) for the sine wave
  // This creates a smooth curve from sunrise to sunset
  let normalizedHour;
  if (exactHour < sunriseHour || exactHour > sunsetHour) {
    return 0; // No production before sunrise or after sunset
  } else {
    normalizedHour = (exactHour - sunriseHour) / (sunsetHour - sunriseHour);
  }
  
  // Use a sine wave for the base production curve
  // This creates a smooth curve that peaks at noon
  const baseProduction = Math.sin(normalizedHour * Math.PI) * maxProduction;
  
  // Weather factors and volatility
  const weatherFactors = {
    'clear': 1,
    'partly-cloudy': 0.7,
    'cloudy': 0.4
  };

  // Add volatility based on weather conditions
  let volatility;
  if (weather === 'clear') {
    // Clear sky: very stable, small random variations
    volatility = 0.95 + Math.random() * 0.1;
  } else if (weather === 'partly-cloudy') {
    // Partly cloudy: moderate variations
    volatility = 0.6 + Math.random() * 0.8;
  } else {
    // Cloudy: high volatility with occasional peaks
    // Use a combination of random factors to create more realistic cloud patterns
    const baseVolatility = 0.2 + Math.random() * 0.4;
    const cloudBreak = Math.random() < 0.1 ? 0.8 + Math.random() * 0.4 : 1;
    const timeBasedFactor = Math.sin(minute * 0.1) * 0.2 + 0.8; // Creates some periodic variation
    volatility = baseVolatility * cloudBreak * timeBasedFactor;
  }
  
  return Math.max(0, baseProduction * weatherFactors[weather] * volatility);
}

// Add event listener for the interval slider
document.getElementById('enodeInterval').addEventListener('input', function(e) {
  document.getElementById('enodeIntervalValue').textContent = e.target.value;
});

// Simulation function
function simulateCharging() {
  const weather = document.getElementById('weather').value;
  const exportPrice = parseFloat(document.getElementById('exportPrice').value);
  const localSolarPrice = parseFloat(document.getElementById('localSolarPrice').value);
  const importPrice = parseFloat(document.getElementById('importPrice').value);
  const startTime = document.getElementById('startTime').value;
  const duration = parseInt(document.getElementById('duration').value);
  const enodeInterval = parseInt(document.getElementById('enodeInterval').value);
  
  // Parse start time
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  
  // Initialize arrays for charts
  const labels = [];
  const solarData = [];
  const enodeChargingData = [];
  const realtimeChargingData = [];
  const enodeGridImportData = [];
  const enodeGridExportData = [];
  const realtimeGridImportData = [];
  const realtimeGridExportData = [];
  
  // Initialize totals for both strategies
  let enodeTotalSolar = 0;
  let enodeTotalGrid = 0;
  let enodeSolarCost = 0;
  let enodeExportEarnings = 0;
  let enodeGridCost = 0;
  let enodeTotalCharged = 0;
  
  let realtimeTotalSolar = 0;
  let realtimeTotalGrid = 0;
  let realtimeSolarCost = 0;
  let realtimeExportEarnings = 0;
  let realtimeGridCost = 0;
  let realtimeTotalCharged = 0;
  
  // Simulate each minute
  for (let minute = 0; minute < duration * 60; minute += SIMULATION_STEP) {
    const currentHour = startHour + Math.floor(minute / 60);
    const currentMinute = startMinute + (minute % 60);
    
    // Calculate solar production
    const solarProduction = calculateSolarProduction(currentHour, currentMinute, weather);
    
    // Enode strategy: update based on configurable interval
    let enodeChargingRate = enodeChargingData[enodeChargingData.length - 1] || 0;
    if (minute % enodeInterval === 0) {
      // At interval points, decide whether to charge or not
      if (solarProduction > 0) {
        // If we have solar power, charge at the maximum possible rate
        enodeChargingRate = Math.min(solarProduction, MAX_CHARGE_RATE);
      } else {
        // If no solar power, stop charging
        enodeChargingRate = 0;
      }
    }
    
    // Real-time strategy: update every minute
    let realtimeChargingRate = 0;
    if (solarProduction > 0) {
      // If we have solar power, charge at the maximum possible rate
      realtimeChargingRate = Math.min(solarProduction, MAX_CHARGE_RATE);
    }
    
    // Calculate grid import/export for both strategies
    const enodeGridPower = solarProduction - enodeChargingRate;
    const realtimeGridPower = solarProduction - realtimeChargingRate;
    
    // Update totals
    const energyStep = SIMULATION_STEP / 60; // Convert minutes to hours
    
    // Enode strategy totals
    if (enodeChargingRate > 0) {
      enodeTotalCharged += enodeChargingRate * energyStep;
      // When charging, use solar power first if available
      if (solarProduction > 0) {
        const solarUsed = Math.min(enodeChargingRate, solarProduction);
        enodeTotalSolar += solarUsed * energyStep;
        enodeSolarCost += solarUsed * energyStep * localSolarPrice;
        // If we need more power than solar provides, use grid
        if (enodeChargingRate > solarProduction) {
          const gridUsed = enodeChargingRate - solarProduction;
          enodeTotalGrid += gridUsed * energyStep;
          enodeGridCost += gridUsed * energyStep * importPrice;
        }
      } else {
        // If no solar, use grid
        enodeTotalGrid += enodeChargingRate * energyStep;
        enodeGridCost += enodeChargingRate * energyStep * importPrice;
      }
    }
    
    // Handle solar exports for Enode strategy
    if (enodeGridPower > 0) {
      enodeExportEarnings += enodeGridPower * energyStep * exportPrice;
    }
    
    // Real-time strategy totals
    if (realtimeChargingRate > 0) {
      realtimeTotalCharged += realtimeChargingRate * energyStep;
    }
    if (realtimeChargingRate > 0) {
      realtimeTotalSolar += realtimeChargingRate * energyStep;
      realtimeSolarCost += realtimeChargingRate * energyStep * localSolarPrice;
    }
    if (realtimeGridPower > 0) {
      realtimeExportEarnings += realtimeGridPower * energyStep * exportPrice;
    } else if (realtimeGridPower < 0) {
      realtimeTotalGrid += Math.abs(realtimeGridPower) * energyStep;
      realtimeGridCost += Math.abs(realtimeGridPower) * energyStep * importPrice;
    }
    
    // Add data points
    labels.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
    solarData.push(solarProduction);
    enodeChargingData.push(enodeChargingRate);
    realtimeChargingData.push(realtimeChargingRate);
    enodeGridImportData.push(enodeGridPower < 0 ? Math.abs(enodeGridPower) : 0);
    enodeGridExportData.push(enodeGridPower > 0 ? -enodeGridPower : 0);
    realtimeGridImportData.push(realtimeGridPower < 0 ? Math.abs(realtimeGridPower) : 0);
    realtimeGridExportData.push(realtimeGridPower > 0 ? -realtimeGridPower : 0);
  }
  
  // Update Enode chart
  enodeChart.data.labels = labels;
  enodeChart.data.datasets[0].data = solarData;
  enodeChart.data.datasets[1].data = enodeGridImportData;
  enodeChart.data.datasets[2].data = enodeGridExportData;
  enodeChart.data.datasets[3].data = enodeChargingData;
  enodeChart.update();
  
  // Update Real-time chart
  realtimeChart.data.labels = labels;
  realtimeChart.data.datasets[0].data = solarData;
  realtimeChart.data.datasets[1].data = realtimeGridImportData;
  realtimeChart.data.datasets[2].data = realtimeGridExportData;
  realtimeChart.data.datasets[3].data = realtimeChargingData;
  realtimeChart.update();
  
  // Update pie charts
  const totalEnodeExported = enodeGridExportData.reduce((a, b) => a + Math.abs(b), 0) * (SIMULATION_STEP / 60);
  enodePieChart.data.datasets[0].data = [
    enodeTotalSolar,
    enodeTotalGrid,
    totalEnodeExported
  ];
  enodePieChart.update();

  const totalRealtimeExported = realtimeGridExportData.reduce((a, b) => a + Math.abs(b), 0) * (SIMULATION_STEP / 60);
  realtimePieChart.data.datasets[0].data = [
    realtimeTotalSolar,
    realtimeTotalGrid,
    totalRealtimeExported
  ];
  realtimePieChart.update();

  // Update energy bar charts
  enodeEnergyBarChart.data.datasets[0].data = [enodeTotalSolar];
  enodeEnergyBarChart.data.datasets[1].data = [enodeTotalGrid];
  enodeEnergyBarChart.data.datasets[2].data = [totalEnodeExported];
  enodeEnergyBarChart.update();

  realtimeEnergyBarChart.data.datasets[0].data = [realtimeTotalSolar];
  realtimeEnergyBarChart.data.datasets[1].data = [realtimeTotalGrid];
  realtimeEnergyBarChart.data.datasets[2].data = [totalRealtimeExported];
  realtimeEnergyBarChart.update();

  // Update cost bar charts
  enodeCostBarChart.data.datasets[0].data = [enodeSolarCost];
  enodeCostBarChart.data.datasets[1].data = [enodeGridCost];
  enodeCostBarChart.data.datasets[2].data = [-enodeExportEarnings];
  enodeCostBarChart.update();

  realtimeCostBarChart.data.datasets[0].data = [realtimeSolarCost];
  realtimeCostBarChart.data.datasets[1].data = [realtimeGridCost];
  realtimeCostBarChart.data.datasets[2].data = [-realtimeExportEarnings];
  realtimeCostBarChart.update();
  
  // Update Enode results
  document.getElementById('enodeTotalSolar').textContent = enodeTotalSolar.toFixed(2);
  document.getElementById('enodeTotalGrid').textContent = enodeTotalGrid.toFixed(2);
  document.getElementById('enodeSolarCost').textContent = enodeSolarCost.toFixed(2);
  document.getElementById('enodeExportEarnings').textContent = enodeExportEarnings.toFixed(2);
  document.getElementById('enodeGridCost').textContent = enodeGridCost.toFixed(2);
  document.getElementById('enodeTotalCost').textContent = (enodeGridCost + enodeSolarCost - enodeExportEarnings).toFixed(2);
  document.getElementById('enodeTotalCharged').textContent = enodeTotalCharged.toFixed(2);
  
  // Calculate and display effective energy cost for Enode
  const enodeEffectiveCost = enodeTotalCharged > 0 ? 
    (enodeGridCost + enodeSolarCost - enodeExportEarnings) / enodeTotalCharged : 0;
  document.getElementById('enodeEffectiveCost').textContent = enodeEffectiveCost.toFixed(3);
  
  // Update Real-time results
  document.getElementById('realtimeTotalSolar').textContent = realtimeTotalSolar.toFixed(2);
  document.getElementById('realtimeTotalGrid').textContent = realtimeTotalGrid.toFixed(2);
  document.getElementById('realtimeSolarCost').textContent = realtimeSolarCost.toFixed(2);
  document.getElementById('realtimeExportEarnings').textContent = realtimeExportEarnings.toFixed(2);
  document.getElementById('realtimeGridCost').textContent = realtimeGridCost.toFixed(2);
  document.getElementById('realtimeTotalCost').textContent = (realtimeGridCost + realtimeSolarCost - realtimeExportEarnings).toFixed(2);
  document.getElementById('realtimeTotalCharged').textContent = realtimeTotalCharged.toFixed(2);
  
  // Calculate and display effective energy cost for Real-time
  const realtimeEffectiveCost = realtimeTotalCharged > 0 ? 
    (realtimeGridCost + realtimeSolarCost - realtimeExportEarnings) / realtimeTotalCharged : 0;
  document.getElementById('realtimeEffectiveCost').textContent = realtimeEffectiveCost.toFixed(3);
}

// Add event listeners to all inputs
const inputs = document.querySelectorAll('input, select');
inputs.forEach(input => {
  input.addEventListener('input', simulateCharging);
});

// Initial simulation
simulateCharging(); 