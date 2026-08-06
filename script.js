const elements = {
  sequenceType: document.getElementById("sequenceType"),
  sequenceLength: document.getElementById("sequenceLength"),
  lengthOutput: document.getElementById("lengthOutput"),
  displayTime: document.getElementById("displayTime"),
  allowRepeats: document.getElementById("allowRepeats"),
  sequenceDisplay: document.getElementById("sequenceDisplay"),
  instruction: document.getElementById("instruction"),
  answerForm: document.getElementById("answerForm"),
  answerInput: document.getElementById("answerInput"),
  startRound: document.getElementById("startRound"),
  hideSequence: document.getElementById("hideSequence"),
  checkAnswer: document.getElementById("checkAnswer"),
  nextRound: document.getElementById("nextRound"),
  feedback: document.getElementById("feedback"),
  statusBadge: document.getElementById("statusBadge"),
  correctScore: document.getElementById("correctScore"),
  attemptScore: document.getElementById("attemptScore"),
  accuracyScore: document.getElementById("accuracyScore"),
  resetScore: document.getElementById("resetScore"),
  tipText: document.getElementById("tipText")
};

const characterSets = {
  numbers: "0123456789",
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  mixed: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
};

const tips = [
  "Read longer sequences in small groups rather than as one continuous string.",
  "Repeat the sequence silently while it is visible.",
  "Focus on accuracy first and increase the length gradually.",
  "For mixed sequences, notice where the sequence changes between letters and numbers.",
  "Practise the same length until you can recall it consistently."
];

let currentSequence = "";
let hideTimer = null;
let score = {
  correct: Number(localStorage.getItem("dispatcherCorrect")) || 0,
  attempts: Number(localStorage.getItem("dispatcherAttempts")) || 0
};

function generateSequence(type, length, repeatsAllowed) {
  const characters = characterSets[type];

  if (!repeatsAllowed && length > characters.length) {
    throw new Error(`Without repeats, this mode supports up to ${characters.length} characters.`);
  }

  const available = characters.split("");
  let result = "";

  for (let i = 0; i < length; i += 1) {
    const source = repeatsAllowed ? characters : available;
    const randomIndex = Math.floor(Math.random() * source.length);
    result += source[randomIndex];

    if (!repeatsAllowed) {
      available.splice(randomIndex, 1);
    }
  }

  return result;
}

function updateScore() {
  elements.correctScore.textContent = score.correct;
  elements.attemptScore.textContent = score.attempts;
  const accuracy = score.attempts
    ? Math.round((score.correct / score.attempts) * 100)
    : 0;
  elements.accuracyScore.textContent = `${accuracy}%`;

  localStorage.setItem("dispatcherCorrect", score.correct);
  localStorage.setItem("dispatcherAttempts", score.attempts);
}

function updateLength() {
  const uniqueMaximum = characterSets[elements.sequenceType.value].length;

  if (!elements.allowRepeats.checked && Number(elements.sequenceLength.value) > uniqueMaximum) {
    elements.sequenceLength.value = uniqueMaximum;
  }

  elements.lengthOutput.textContent = elements.sequenceLength.value;
  elements.answerInput.maxLength = elements.sequenceLength.value;
}

function lockSettings(locked) {
  elements.sequenceType.disabled = locked;
  elements.sequenceLength.disabled = locked;
  elements.displayTime.disabled = locked;
  elements.allowRepeats.disabled = locked;
}

function clearHideTimer() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function hideCurrentSequence() {
  clearHideTimer();
  elements.sequenceDisplay.textContent = "•".repeat(currentSequence.length);
  elements.instruction.textContent = "The sequence is hidden. Enter it from memory.";
  elements.hideSequence.classList.add("hidden");
  elements.answerInput.disabled = false;
  elements.checkAnswer.disabled = false;
  elements.statusBadge.textContent = "Recall";
  elements.answerInput.focus();
}

function startRound() {
  clearHideTimer();
  elements.feedback.className = "feedback hidden";
  elements.feedback.textContent = "";
  elements.answerInput.value = "";
  elements.answerInput.disabled = true;
  elements.checkAnswer.disabled = true;
  elements.startRound.classList.add("hidden");
  elements.nextRound.classList.add("hidden");
  lockSettings(true);

  try {
    currentSequence = generateSequence(
      elements.sequenceType.value,
      Number(elements.sequenceLength.value),
      elements.allowRepeats.checked
    );
  } catch (error) {
    elements.feedback.textContent = error.message;
    elements.feedback.className = "feedback incorrect";
    elements.startRound.classList.remove("hidden");
    lockSettings(false);
    return;
  }

  elements.sequenceDisplay.textContent = currentSequence;
  elements.instruction.textContent = "Memorize this sequence before it disappears.";
  elements.statusBadge.textContent = "Memorize";

  const delay = Number(elements.displayTime.value);

  if (delay === 0) {
    elements.hideSequence.classList.remove("hidden");
  } else {
    elements.hideSequence.classList.add("hidden");
    hideTimer = setTimeout(hideCurrentSequence, delay);
  }
}

function checkAnswer(event) {
  event.preventDefault();

  const answer = elements.answerInput.value.trim().toUpperCase();

  if (!answer) {
    elements.feedback.textContent = "Enter an answer before checking.";
    elements.feedback.className = "feedback incorrect";
    elements.answerInput.focus();
    return;
  }

  score.attempts += 1;
  const correct = answer === currentSequence;

  if (correct) {
    score.correct += 1;
    elements.feedback.innerHTML = `Correct! The sequence was <strong>${currentSequence}</strong>.`;
    elements.feedback.className = "feedback correct";
  } else {
    elements.feedback.innerHTML =
      `Your answer was <strong>${answer}</strong>. The correct sequence was ` +
      `<strong>${currentSequence}</strong>.`;
    elements.feedback.className = "feedback incorrect";
  }

  updateScore();
  elements.sequenceDisplay.textContent = currentSequence;
  elements.instruction.textContent = "Review the correct sequence, then continue.";
  elements.answerInput.disabled = true;
  elements.checkAnswer.disabled = true;
  elements.nextRound.classList.remove("hidden");
  elements.statusBadge.textContent = correct ? "Correct" : "Review";
  elements.tipText.textContent = tips[Math.floor(Math.random() * tips.length)];
}

function prepareNextRound() {
  elements.feedback.className = "feedback hidden";
  elements.feedback.textContent = "";
  elements.sequenceDisplay.textContent = "•".repeat(Number(elements.sequenceLength.value));
  elements.instruction.textContent = "Press “Start round” to reveal a sequence.";
  elements.statusBadge.textContent = "Ready";
  elements.startRound.classList.remove("hidden");
  elements.nextRound.classList.add("hidden");
  lockSettings(false);
  elements.startRound.focus();
}

elements.sequenceLength.addEventListener("input", updateLength);
elements.sequenceType.addEventListener("change", updateLength);
elements.allowRepeats.addEventListener("change", updateLength);
elements.startRound.addEventListener("click", startRound);
elements.hideSequence.addEventListener("click", hideCurrentSequence);
elements.answerForm.addEventListener("submit", checkAnswer);
elements.nextRound.addEventListener("click", prepareNextRound);
elements.resetScore.addEventListener("click", () => {
  score = { correct: 0, attempts: 0 };
  updateScore();
});

updateLength();
updateScore();
