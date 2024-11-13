document.addEventListener('DOMContentLoaded', function () {
  // Get references to DOM elements for login and main app
  const loginForm = document.getElementById('login-form');
  const loginContainer = document.getElementById('login-container');
  const trackerSection = document.getElementById('trackerSection');

  // Budget App Elements
  const descriptionInput = document.getElementById('description');
  const amountInput = document.getElementById('amount');
  const categoryInput = document.getElementById('category');
  const addTransactionBtn = document.getElementById('addTransaction');
  const totalIncomeElement = document.getElementById('totalIncome');
  const totalExpenseElement = document.getElementById('totalExpense');
  const budgetProgressElement = document.getElementById('progressBar');
  const transactionsList = document.getElementById('transactionsList');
  const incomeChartElement = document.getElementById('incomeChart');
  const timeframeSelect = document.getElementById('timeframe');

  let currentUser = null;
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

  // Function to handle login
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const storedPassword = localStorage.getItem(`${username}_password`);

    if (storedPassword === password || !storedPassword) {
      currentUser = username;
      if (!storedPassword) {
        // Save password if it's a new user
        localStorage.setItem(`${username}_password`, password);
      }
      loginContainer.style.display = 'none'; // Hide the login form
      trackerSection.classList.remove('hidden'); // Show the main tracker section
      trackerSection.classList.add('visible'); // Ensure it's visible
      loadUserData();
    } else {
      alert('Incorrect password. Please try again.');
    }
  });

  // Function to load user data
  function loadUserData() {
    const userTransactions = JSON.parse(localStorage.getItem(currentUser + '_transactions')) || [];
    transactions = userTransactions;
    updateDisplay();
  }

  // Function to save user data
  function saveUserData() {
    if (currentUser) {
      localStorage.setItem(currentUser + '_transactions', JSON.stringify(transactions));
    }
  }

  // Update display with latest data
  function updateDisplay() {
    const timeframe = timeframeSelect.value;
    const filteredTransactions = filterTransactions(timeframe);

    const totalIncome = calculateTotal(filteredTransactions, 'income');
    const totalExpenses = calculateTotal(filteredTransactions, 'expense');

    totalIncomeElement.textContent = `$${totalIncome.toFixed(2)}`;
    totalExpenseElement.textContent = `$${totalExpenses.toFixed(2)}`;

    const progressPercentage = (totalExpenses / totalIncome) * 100;
    budgetProgressElement.style.width = `${Math.min(progressPercentage, 100)}%`;

    displayTransactions(filteredTransactions);
    updateChart(totalIncome, totalExpenses);
  }

  // Filter transactions by timeframe
  function filterTransactions(timeframe) {
    const now = new Date();
    let filteredTransactions = transactions;

    // Filter logic remains the same
    if (timeframe === 'daily') {
      filteredTransactions = transactions.filter(transaction => isSameDay(transaction.date, now));
    } else if (timeframe === 'weekly') {
      filteredTransactions = transactions.filter(transaction => isSameWeek(transaction.date, now));
    } else if (timeframe === 'monthly') {
      filteredTransactions = transactions.filter(transaction => isSameMonth(transaction.date, now));
    } else if (timeframe === 'yearly') {
      filteredTransactions = transactions.filter(transaction => isSameYear(transaction.date, now));
    }

    return filteredTransactions;
  }

  // Date helper functions
  function isSameDay(transactionDate, now) {
    const transaction = new Date(transactionDate);
    return transaction.getDate() === now.getDate() && transaction.getMonth() === now.getMonth() && transaction.getFullYear() === now.getFullYear();
  }

  function isSameWeek(transactionDate, now) {
    const transaction = new Date(transactionDate);
    const firstDayOfYear = new Date(transaction.getFullYear(), 0, 1);
    const pastDaysOfYear = (transaction - firstDayOfYear) / 86400000;
    const currentWeek = Math.ceil((now - firstDayOfYear) / 86400000 / 7);
    return Math.ceil(pastDaysOfYear / 7) === currentWeek;
  }

  function isSameMonth(transactionDate, now) {
    const transaction = new Date(transactionDate);
    return transaction.getMonth() === now.getMonth() && transaction.getFullYear() === now.getFullYear();
  }

  function isSameYear(transactionDate, now) {
    const transaction = new Date(transactionDate);
    return transaction.getFullYear() === now.getFullYear();
  }

  // Calculate total income or expenses
  function calculateTotal(filteredTransactions, type) {
    return filteredTransactions.reduce((total, transaction) => {
      return transaction.category === type ? total + transaction.amount : total;
    }, 0);
  }

  // Display transactions in the UI
  function displayTransactions(filteredTransactions) {
    transactionsList.innerHTML = '';
    if (filteredTransactions.length === 0) {
      transactionsList.innerHTML = '<p>No transactions for this timeframe.</p>';
      return;
    }

    filteredTransactions.forEach(transaction => {
      const li = document.createElement('li');
      li.classList.add(transaction.category);
      li.innerHTML = `
        <span>${transaction.description}</span> 
        - $${transaction.amount.toFixed(2)} 
        <small>(${transaction.date})</small>
      `;
      transactionsList.appendChild(li);
    });
  }

  // Add a new transaction
  function addTransaction() {
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;

    if (!description || isNaN(amount) || amount <= 0) {
      alert('Please provide valid description and amount.');
      return;
    }

    const transaction = {
      description,
      amount,
      category,
      date: new Date().toLocaleDateString()
    };

    transactions.push(transaction);
    saveUserData();
    descriptionInput.value = '';
    amountInput.value = '';
    updateDisplay();
  }

  // Update the chart with income and expenses
  function updateChart(income, expenses) {
    const ctx = incomeChartElement.getContext('2d');
    const chartData = {
      labels: ['Income', 'Expenses'],
      datasets: [{
        label: 'Total',
        data: [income, expenses],
        backgroundColor: ['#4CAF50', '#FF5733'],
        borderColor: ['#388E3C', '#F44336'],
        borderWidth: 1
      }]
    };

    if (window.chartInstance) {
      window.chartInstance.data = chartData;
      window.chartInstance.update();
    } else {
      window.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              position: 'top',
            },
          },
        },
      });
    }
  }

  // Event listeners
  addTransactionBtn.addEventListener('click', addTransaction);
  timeframeSelect.addEventListener('change', updateDisplay);

  // Initialize the display
  updateDisplay();
});
