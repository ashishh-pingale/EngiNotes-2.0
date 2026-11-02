import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Target,
  Sparkles,
  ShieldCheck,
  Users,
  ChevronDown,
  ArrowRight
} from "lucide-react";

const values = [
  {
    icon: <Target className="w-6 h-6 text-blue-600" />,
    title: "Our Mission",
    desc: "To democratize engineering study resources so no student is left behind due to lack of quality notes or textbooks."
  },
  {
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    title: "Peer-Driven Learning",
    desc: "Built on the philosophy that peers teach peers best. Students know the actual exam patterns, faculty quirks, and high-yield topics."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
    title: "Quality Moderation",
    desc: "Every note undergoes verification to guarantee clean scans, readable handwriting, and strict syllabus adherence."
  }
];

const faqs = [
  {
    q: "Is EngiNotes completely free to use?",
    a: "Yes! EngiNotes is 100% free for all students. There are no paywalls, subscriptions, or hidden charges to browse or download notes."
  },
  {
    q: "How can I upload my own notes?",
    a: "Create an account, head over to the Upload page, drag and drop your PDF file, fill in the subject and branch details, and hit submit. Our moderators will review it shortly."
  },
  {
    q: "Can I connect with students from other colleges?",
    a: "Absolutely! The Discover page allows you to search for students by branch and college, follow them, and exchange questions via direct chat."
  },
  {
    q: "What file formats are supported?",
    a: "We currently support high-resolution PDF documents up to 25 MB in size."
  }
];

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="space-y-24 py-12 pb-24">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /> About EngiNotes
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Simplifying Engineering Education Through Community Knowledge
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          EngiNotes was born out of a simple observation: every semester, engineering students scramble
          for good handwritten notes across WhatsApp groups, Google Drives, and photocopy shops. We built
          a single unified home for all of it.
        </p>
      </section>

      {/* Values Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((v, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 w-fit">{v.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{v.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Everything you need to know about using and contributing to EngiNotes.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-6 py-4.5 text-left flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openFaq === idx ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-50 dark:border-slate-800">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white space-y-4 shadow-xl">
          <h2 className="text-2xl font-bold">Have questions or want to collaborate?</h2>
          <p className="text-sm text-blue-100 max-w-md mx-auto">
            Drop us a message via our contact form and our student coordinator team will get in touch.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors shadow"
          >
            Contact Team <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
