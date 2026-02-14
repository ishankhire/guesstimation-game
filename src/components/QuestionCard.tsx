"use client";

interface QuestionCardProps {
  question: string;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  return (
    <div className="w-full px-6 py-8">
      <h2 className="text-2xl md:text-3xl font-light text-zinc-800 dark:text-zinc-200 leading-relaxed">
        {question}
      </h2>
    </div>
  );
}
