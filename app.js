// --- Application Configuration ---
// !! IMPORTANT: Replace with YOUR contract address and ABI !!
const contractAddress = "0x45cA0b71B094Fe0cFc5f8C4Ee894BBB86C5c18d7"; // Replace with your contract address
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_content",
				"type": "string"
			}
		],
		"name": "createTask",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "completed",
				"type": "bool"
			}
		],
		"name": "TaskCompletedToggled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "content",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "completed",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "TaskCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "toggleCompleted",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "getTask",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "taskCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "tasks",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "content",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "completed",
				"type": "bool"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
    // Replace with your contract ABI

// --- Global Variables ---
let provider;
let signer;
let contract;
let currentAccount = null;

// --- DOM Elements ---
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletStatusElem = document.getElementById('walletStatus');
const accountAddressElem = document.getElementById('accountAddress');
const appContentElem = document.getElementById('appContent');
const newTaskContentInput = document.getElementById('newTaskContent');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskListElem = document.getElementById('taskList');
const txStatusElem = document.getElementById('txStatus');

// --- Core Functions ---

// 1. Connect to MetaMask Wallet
async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            handleAccountsChanged(accounts);

            // Initialize provider, signer, and contract
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();

            const network = await provider.getNetwork();
            console.log("Connected to network:", network);

            const EXPECTED_CHAIN_ID = 1337; // Replace with your chain ID
            if (network.chainId !== EXPECTED_CHAIN_ID) {
                alert("Please switch to the correct network in MetaMask.");
                return;
            }

            contract = new ethers.Contract(contractAddress, contractABI, signer);
            console.log("Contract initialized:", contract);

            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        } catch (err) {
            console.error("Connection failed:", err);
        }
    } else {
        alert("Please install MetaMask to use this feature.");
    }
}

// 2. Handle Account Change Events
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        console.log('Please connect to MetaMask.');
        walletStatusElem.textContent = 'Status: Disconnected';
        accountAddressElem.textContent = 'N/A';
        appContentElem.style.display = 'none';
        connectWalletBtn.disabled = false;
        currentAccount = null;
    } else if (accounts[0] !== currentAccount) {
        currentAccount = accounts[0];
        console.log('Account connected:', currentAccount);
        walletStatusElem.textContent = 'Status: Connected';
        accountAddressElem.textContent = currentAccount;
        appContentElem.style.display = 'block'; // Show the main app content
        connectWalletBtn.disabled = true; // Disable connect button once connected

        // Load tasks after connecting
        loadTasks();
    }
}

// 3. Load Tasks from the Smart Contract
async function loadTasks() {
    if (!contract) {
        console.error("Contract not initialized");
        taskListElem.innerHTML = '<li>Error: Contract not loaded. Connect wallet first.</li>';
        return;
    }

    taskListElem.innerHTML = '<li class="loading">Loading tasks...</li>'; // Show loading state
    txStatusElem.textContent = ''; // Clear previous tx status

    try {
        const taskCounter = await contract.taskCount();
        const count = taskCounter.toNumber(); // Convert BigNumber to number

        if (count === 0) {
            taskListElem.innerHTML = '<li>No tasks yet! Add one above.</li>';
            return;
        }

        let tasksHtml = '';
        for (let i = 1; i <= count; i++) {
            try {
                const taskDetails = await contract.getTask(i);
                const [id, content, completed, owner] = taskDetails;

                if (content) {
                    tasksHtml += `
                        <li class="${completed ? 'completed' : ''}" data-id="${id.toNumber()}">
                            <span>${escapeHtml(content)}</span>
                            <button onclick="toggleTask(${id.toNumber()})">${completed ? 'Mark Incomplete' : 'Mark Complete'}</button>
                            <button onclick="viewTransactionDetails(${id.toNumber()})">View Details</button>
                        </li>
                    `;
                }
            } catch (innerError) {
                console.warn(`Could not load task ID ${i}:`, innerError);
            }
        }
        taskListElem.innerHTML = tasksHtml;

    } catch (error) {
        console.error("Error loading tasks:", error);
        taskListElem.innerHTML = '<li>Error loading tasks. Check console.</li>';
    }
}
//view transaction details
async function viewTransactionDetails(taskId) {
    if (!contract || !provider) {
        alert("Please connect your wallet first!");
        return;
    }

    try {
        // Fetch all TaskCreated events
        const events = await contract.queryFilter(contract.filters.TaskCreated());

        // Find the event with the matching task ID
        const event = events.find(e => e.args.id.toNumber() === taskId);

        if (!event) {
            alert("No transaction details found for this task.");
            return;
        }

        const transactionHash = event.transactionHash;

        // Fetch the transaction receipt
        const receipt = await provider.getTransactionReceipt(transactionHash);

        // Fetch the transaction details
        const transaction = await provider.getTransaction(transactionHash);

        // Fetch the block details for the timestamp
        const block = await provider.getBlock(receipt.blockNumber);

        // Populate the transaction details section
        const transactionDetailsElem = document.getElementById('transactionDetails');
        const transactionInfoElem = document.getElementById('transactionInfo');
        transactionInfoElem.innerHTML = `
            <strong>Task ID:</strong> ${taskId}<br>
            <strong>Transaction Hash:</strong> ${transactionHash}<br>
            <strong>Block Number:</strong> ${receipt.blockNumber}<br>
            <strong>Gas Used:</strong> ${receipt.gasUsed.toString()}<br>
            <strong>Timestamp:</strong> ${new Date(block.timestamp * 1000).toLocaleString()}
        `;
        transactionDetailsElem.style.display = 'block';
    } catch (error) {
        console.error("Error fetching transaction details:", error);
        alert("Error fetching transaction details. Check the console for more information.");
    }
}
// 4. Add a New Task
async function addTask() {
    const content = newTaskContentInput.value.trim();
    if (!content) {
        alert("Task content cannot be empty!");
        return;
    }
    if (!contract || !signer) {
        alert("Please connect your wallet first!");
        return;
    }

    txStatusElem.textContent = 'Sending transaction... Please wait.';
    addTaskBtn.disabled = true;

    try {
        const tx = await contract.createTask(content);
        console.log('Transaction sent:', tx.hash);

        txStatusElem.textContent = `Transaction sent (${tx.hash}). Waiting for confirmation...`;

        await tx.wait();
        console.log('Transaction confirmed!');

        txStatusElem.textContent = 'Task added successfully!';
        newTaskContentInput.value = '';
        await loadTasks();

    } catch (error) {
        console.error("Error adding task:", error);
        txStatusElem.textContent = `Error adding task: ${error.message}`;
    } finally {
        addTaskBtn.disabled = false;
        setTimeout(() => { txStatusElem.textContent = ''; }, 5000);
    }
}

// 5. Toggle Task Completion Status
async function toggleTask(id) {
    if (!contract || !signer) {
        alert("Please connect your wallet first!");
        return;
    }

    console.log(`Toggling task ID: ${id}`);
    txStatusElem.textContent = `Toggling task ${id}... Please wait.`;

    try {
        const tx = await contract.toggleCompleted(id);
        console.log(`Toggle transaction sent: ${tx.hash}`);
        txStatusElem.textContent = `Toggle transaction sent (${tx.hash}). Waiting for confirmation...`;

        await tx.wait();
        console.log('Toggle transaction confirmed!');

        txStatusElem.textContent = `Task ${id} status updated successfully!`;
        await loadTasks();

    } catch (error) {
        console.error(`Error toggling task ${id}:`, error);
        txStatusElem.textContent = `Error toggling task: ${error.message}`;
    } finally {
        setTimeout(() => { txStatusElem.textContent = ''; }, 5000);
    }
}

// Utility function to prevent basic HTML injection
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- Event Listeners ---
connectWalletBtn.addEventListener('click', connectWallet);
addTaskBtn.addEventListener('click', addTask);