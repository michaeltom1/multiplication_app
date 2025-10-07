document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const tableSelect = document.getElementById("tableSelect");
  const timerDurationInput = document.getElementById("timerDuration");
  const startButton = document.getElementById("startButton");
  const quizArea = document.querySelector(".quiz-area");
  const settingsArea = document.querySelector(".settings");
  const resultsArea = document.querySelector(".results-area");
  const timeDisplay = document.getElementById("time");
  const currentQuestionNumDisplay =
    document.getElementById("currentQuestionNum");
  const questionDisplay = document.getElementById("question");
  const optionsContainer = document.getElementById("options");
  const correctAnswersDisplay = document.getElementById("correctAnswers");
  const incorrectAnswersDisplay = document.getElementById("incorrectAnswers");
  const restartButton = document.getElementById("restartButton");

  let selectedTable = 2;
  let quizQuestions = [];
  let currentQuestionIndex = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let timer;
  let timeLeft;
  let quizDuration;

  // Event Listeners
  tableSelect.addEventListener("change", (e) => {
    selectedTable = parseInt(e.target.value);
  });

  startButton.addEventListener("click", startQuiz);
  restartButton.addEventListener("click", resetQuiz);

  // --- Quiz Logic Functions ---

  function generateQuestions(table, count = 12) {
    const questions = [];
    for (let i = 1; i <= count; i++) {
      const num1 = i;
      const num2 = table;
      const correctAnswer = num1 * num2;
      questions.push({
        question: `${num1} &times; ${num2} = ?`,
        correctAnswer: correctAnswer,
      });
    }
    return shuffleArray(questions);
  }

  function generateOptions(correctAnswer) {
    const options = new Set();
    options.add(correctAnswer);

    while (options.size < 4) {
      let incorrectOption;
      const diff = Math.floor(Math.random() * 10) - 5;
      incorrectOption = correctAnswer + diff;

      if (
        incorrectOption > 0 &&
        incorrectOption !== correctAnswer &&
        !options.has(incorrectOption)
      ) {
        options.add(incorrectOption);
      }
    }
    return shuffleArray(Array.from(options));
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function startQuiz() {
    selectedTable = parseInt(tableSelect.value);
    quizDuration = parseInt(timerDurationInput.value);
    if (isNaN(quizDuration) || quizDuration < 10) {
      alert("Please enter a valid timer duration (at least 10 seconds).");
      return;
    }

    quizQuestions = generateQuestions(selectedTable);
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0; // This will now typically be 0 or 1
    timeLeft = quizDuration;

    settingsArea.classList.add("hidden");
    resultsArea.classList.add("hidden");
    quizArea.classList.remove("hidden");

    startTimer();
    showQuestion();
  }

  function startTimer() {
    timeDisplay.textContent = timeLeft;
    timer = setInterval(() => {
      timeLeft--;
      timeDisplay.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        endQuiz();
      }
    }, 1000);
  }

  function showQuestion() {
    // If all questions answered, end quiz
    if (currentQuestionIndex >= quizQuestions.length) {
      clearInterval(timer);
      endQuiz();
      return;
    }

    const q = quizQuestions[currentQuestionIndex];
    currentQuestionNumDisplay.textContent = currentQuestionIndex + 1;
    questionDisplay.innerHTML = q.question;
    optionsContainer.innerHTML = ""; // Clear previous options

    const optionsForCurrentQuestion = generateOptions(q.correctAnswer);

    optionsForCurrentQuestion.forEach((option) => {
      const button = document.createElement("button");
      button.classList.add("option-button");
      button.textContent = option;
      button.addEventListener("click", () =>
        handleAnswer(button, option, q.correctAnswer)
      );
      optionsContainer.appendChild(button);
    });
  }

  function handleAnswer(clickedButton, chosenAnswer, correctAnswer) {
    // Disable all options after an answer is chosen
    Array.from(optionsContainer.children).forEach((button) => {
      button.disabled = true;
      if (parseInt(button.textContent) === correctAnswer) {
        button.classList.add("correct");
      } else {
        button.classList.add("incorrect");
      }
    });

    if (parseInt(chosenAnswer) === correctAnswer) {
      correctCount++;
      // If correct, proceed to next question
      currentQuestionIndex++;
      showQuestion();
    } else {
      // If incorrect, stop the quiz immediately
      incorrectCount++; // Mark one incorrect answer
      clearInterval(timer); // Stop the timer
      setTimeout(() => {
        // Give a small delay to see the red feedback
        endQuiz();
      }, 1000); // 1-second delay before showing results
    }
  }

  function endQuiz() {
    clearInterval(timer); // Ensure timer is stopped if it's not already (e.g., from timer running out)
    quizArea.classList.add("hidden");
    settingsArea.classList.add("hidden");
    resultsArea.classList.remove("hidden");

    correctAnswersDisplay.textContent = correctCount;
    incorrectAnswersDisplay.textContent = incorrectCount; // Will be 1 if stopped by wrong answer, or 0 if all correct/time ran out
  }

  function resetQuiz() {
    clearInterval(timer);
    settingsArea.classList.remove("hidden");
    quizArea.classList.add("hidden");
    resultsArea.classList.add("hidden");
    timerDurationInput.value = 30;
    tableSelect.value = 2;
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
  }

  // Initial setup
  resetQuiz();
});
