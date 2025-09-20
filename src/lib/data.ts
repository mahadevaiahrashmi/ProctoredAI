export const examData = {
  title: "Introduction to Quantum Physics",
  questions: [
    {
      id: 1,
      type: "multiple-choice" as const,
      text: "Which of the following principles states that it is impossible to know both the exact position and exact momentum of a particle at the same time?",
      options: [
        "Pauli Exclusion Principle",
        "Heisenberg Uncertainty Principle",
        "Aufbau Principle",
        "Schrödinger's Cat Paradox",
      ],
    },
    {
      id: 2,
      type: "text" as const,
      text: "Explain the concept of wave-particle duality in your own words. Provide at least one example of a phenomenon that demonstrates this duality.",
    },
    {
      id: 3,
      type: "multiple-choice" as const,
      text: "What is a 'quantum leap' or 'quantum jump'?",
      options: [
        "The continuous movement of a particle from one location to another.",
        "A particle gaining enough energy to travel faster than light.",
        "An electron abruptly moving from one energy level to another, without passing through the space in between.",
        "The splitting of a quantum state into multiple, separate states.",
      ],
    },
    {
      id: 4,
      type: "multiple-choice" as const,
      text: "In the context of quantum mechanics, what does the wave function (ψ) of a particle represent?",
      options: [
        "The exact trajectory of the particle.",
        "The particle's kinetic energy.",
        "The probability amplitude of finding the particle at a certain point in space and time.",
        "The particle's charge.",
      ],
    },
    {
        id: 5,
        type: "text" as const,
        text: "Briefly describe the phenomenon of quantum entanglement. What is the key characteristic that makes it so peculiar?"
    }
  ],
};
