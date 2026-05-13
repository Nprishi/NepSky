import React, { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Phone,
  Mail,
  Clock,
  Send,
  HelpCircle,
  FileText,
  CreditCard,
  Plane,
  MessageCircle,
  ShieldCheck,
  Headphones,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ActiveTab = 'contact' | 'faq' | 'chat';

type ChatMessage = {
  id: number | string;
  sender: 'user' | 'support';
  message: string;
  time: string;
};

const Support: React.FC = () => {
  const { user } = useAuth();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatSubmitting, setIsChatSubmitting] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    subject: '',
    category: '',
    message: '',
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'support',
      message: 'Hello! Welcome to NepSky support. How can we help you today?',
      time: new Date().toISOString(),
    },
  ]);

  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    setContactForm((prev) => ({
      ...prev,
      name: user ? `${user.firstName} ${user.lastName}` : prev.name,
      email: user?.email || prev.email,
    }));
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const apiBaseUrl = useMemo(() => {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetContactForm = () => {
    setContactForm({
      name: user ? `${user.firstName} ${user.lastName}` : '',
      email: user?.email || '',
      subject: '',
      category: '',
      message: '',
    });
  };

  const validateContactForm = () => {
    if (!contactForm.name.trim()) return 'Full name is required.';
    if (!contactForm.email.trim()) return 'Email is required.';
    if (!contactForm.category.trim()) return 'Please select a category.';
    if (!contactForm.subject.trim()) return 'Subject is required.';
    if (!contactForm.message.trim()) return 'Message is required.';
    if (contactForm.message.trim().length < 10) {
      return 'Message should be at least 10 characters.';
    }
    return null;
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateContactForm();
    if (validationError) {
      await Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: validationError,
        confirmButtonText: 'OK',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Send this message?',
      text: 'Please confirm before submitting your support request.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, send it',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      background: '#0f172a',
      color: '#ffffff',
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/support/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id || null,
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          subject: contactForm.subject.trim(),
          category: contactForm.category.trim(),
          message: contactForm.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to submit support message.');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Message Sent',
        text: 'Your support request has been saved successfully.',
        confirmButtonColor: '#2563eb',
      });

      resetContactForm();
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error?.message || 'Something went wrong. Please try again.',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('booking') || lowerMessage.includes('reservation')) {
      return 'For booking help, please check your My Bookings section or share your PNR number.';
    }
    if (lowerMessage.includes('refund') || lowerMessage.includes('cancel')) {
      return 'Refunds usually depend on the ticket rules. Please share your booking details for faster assistance.';
    }
    if (lowerMessage.includes('check-in') || lowerMessage.includes('boarding')) {
      return 'Online check-in usually opens before departure. You can use your booking details to continue.';
    }
    if (lowerMessage.includes('baggage') || lowerMessage.includes('luggage')) {
      return 'Baggage allowance depends on airline and fare type. Please share your route or ticket details.';
    }

    return 'Thank you for your message. Our support team will review it and assist you shortly.';
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || isChatSubmitting) return;

    const optimisticUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      message: trimmedMessage,
      time: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, optimisticUserMessage]);
    setNewMessage('');
    setIsChatSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/support/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id || null,
          name: user ? `${user.firstName} ${user.lastName}` : null,
          email: user?.email || null,
          message: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to save chat message.');
      }

      const supportReply: ChatMessage = {
        id: `support-${Date.now()}`,
        sender: 'support',
        message: getBotResponse(trimmedMessage),
        time: new Date().toISOString(),
      };

      setTimeout(() => {
        setChatMessages((prev) => [...prev, supportReply]);
      }, 500);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `support-error-${Date.now()}`,
          sender: 'support',
          message: 'Sorry, your message could not be delivered right now. Please try again.',
          time: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsChatSubmitting(false);
    }
  };

  const faqData = [
    {
      category: 'Booking & Reservations',
      icon: <Plane className="h-5 w-5" />,
      questions: [
        {
          q: 'How can I book a flight?',
          a: 'Search your route, choose the flight, enter passenger details, and complete payment.',
        },
        {
          q: 'Can I modify my booking?',
          a: 'Yes, depending on the airline and fare rules. Some changes may include extra charges.',
        },
        {
          q: 'How do I cancel my booking?',
          a: 'You can cancel from My Bookings or contact support for manual assistance.',
        },
      ],
    },
    {
      category: 'Check-in & Boarding',
      icon: <FileText className="h-5 w-5" />,
      questions: [
        {
          q: 'When can I check in online?',
          a: 'This depends on the airline, but online check-in usually opens before departure.',
        },
        {
          q: 'What documents do I need?',
          a: 'For international flights, a valid passport and any required visa documents are needed.',
        },
        {
          q: 'Can I select seats?',
          a: 'Yes, if the airline allows it. Some seats may require extra payment.',
        },
      ],
    },
    {
      category: 'Payment & Refunds',
      icon: <CreditCard className="h-5 w-5" />,
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'Accepted methods depend on your system integration such as cards, wallets, or payment gateways.',
        },
        {
          q: 'How long do refunds take?',
          a: 'Refund timelines depend on the airline, fare rule, and original payment method.',
        },
        {
          q: 'Are there any booking fees?',
          a: 'Any service or booking fee should be clearly shown before payment confirmation.',
        },
      ],
    },
  ];

  const tabButtonClass = (tab: ActiveTab) =>
    `group relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-300 ${activeTab === tab
      ? 'text-white'
      : 'text-slate-300 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.25),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.18),_transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {/* Hero */}
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-200">
                  <Headphones className="h-4 w-4" />
                  24/7 Customer Support Center
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Need help with your booking?
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Contact NepSky support for booking issues, refund questions, baggage help,
                  check-in assistance, and general travel guidance.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Secure message handling
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                    <Clock className="h-4 w-4 text-sky-400" />
                    Fast response support
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                    <MessageCircle className="h-4 w-4 text-violet-400" />
                    Contact + Live chat
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15">
                    <Phone className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold">Call Us</h3>
                  <p className="mt-1 text-sm text-slate-400">24/7 service desk</p>
                  <p className="mt-2 font-semibold text-blue-300">+977-XXXXXXXXXX</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
                    <Mail className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold">Email</h3>
                  <p className="mt-1 text-sm text-slate-400">We reply as soon as possible</p>
                  <p className="mt-2 font-semibold text-emerald-300">support@nepsky.com</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15">
                    <Clock className="h-6 w-6 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-bold">Availability</h3>
                  <p className="mt-1 text-sm text-slate-400">Support operation time</p>
                  <p className="mt-2 font-semibold text-violet-300">Always Open</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            {/* Tabs */}
            <div className="border-b border-white/10 bg-slate-900/60 px-3 py-3 sm:px-5">
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-2">
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`${tabButtonClass('contact')} ${activeTab === 'contact' ? 'rounded-xl bg-blue-600 shadow-lg shadow-blue-900/30' : 'rounded-xl'
                    }`}
                >
                  <Mail className="h-4 w-4" />
                  Contact
                </button>

                <button
                  onClick={() => setActiveTab('faq')}
                  className={`${tabButtonClass('faq')} ${activeTab === 'faq' ? 'rounded-xl bg-blue-600 shadow-lg shadow-blue-900/30' : 'rounded-xl'
                    }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  FAQ
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`${tabButtonClass('chat')} ${activeTab === 'chat' ? 'rounded-xl bg-blue-600 shadow-lg shadow-blue-900/30' : 'rounded-xl'
                    }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  Live Chat
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              {/* Contact */}
              {activeTab === 'contact' && (
                <div className="grid gap-8 lg:grid-cols-[1fr_0.38fr]">
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold">Send us a message</h2>
                      <p className="mt-2 text-sm text-slate-400">
                        Fill out the form below and your message will be stored permanently in the database.
                      </p>
                    </div>

                    <form onSubmit={handleContactSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-200">
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={contactForm.name}
                            onChange={handleContactChange}
                            required
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            placeholder="Enter your full name"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-200">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={handleContactChange}
                            required
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            placeholder="Enter your email"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-200">
                            Category
                          </label>
                          <select
                            name="category"
                            value={contactForm.category}
                            onChange={handleContactChange}
                            required
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                          >
                            <option value="">Select a category</option>
                            <option value="booking">Booking & Reservations</option>
                            <option value="checkin">Check-in & Boarding</option>
                            <option value="baggage">Baggage</option>
                            <option value="refund">Refunds & Cancellations</option>
                            <option value="special">Special Assistance</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-200">
                            Subject
                          </label>
                          <input
                            type="text"
                            name="subject"
                            value={contactForm.subject}
                            onChange={handleContactChange}
                            required
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            placeholder="Brief issue subject"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">
                          Message
                        </label>
                        <textarea
                          name="message"
                          value={contactForm.message}
                          onChange={handleContactChange}
                          required
                          rows={7}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                          placeholder="Write your message here..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Confirm & Send Message
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                      <h3 className="text-lg font-bold">Support Tips</h3>
                      <ul className="mt-4 space-y-3 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="mt-0.5 h-4 w-4 text-blue-400" />
                          Include booking ID, ticket number, or route if available.
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="mt-0.5 h-4 w-4 text-blue-400" />
                          Use a clear subject for faster response.
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="mt-0.5 h-4 w-4 text-blue-400" />
                          Your submitted message will remain stored in the database.
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-violet-600/20 p-5">
                      <h3 className="text-lg font-bold">Need urgent help?</h3>
                      <p className="mt-2 text-sm text-slate-300">
                        Use live chat for quick assistance or call support directly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ */}
              {activeTab === 'faq' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Find common answers for booking, payment, check-in, and travel support.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {faqData.map((category, categoryIndex) => (
                      <div
                        key={categoryIndex}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60"
                      >
                        <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
                          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-300">{category.icon}</div>
                          <h3 className="text-lg font-bold">{category.category}</h3>
                        </div>

                        <div className="divide-y divide-white/10">
                          {category.questions.map((faq, faqIndex) => (
                            <details key={faqIndex} className="group">
                              <summary className="cursor-pointer list-none px-5 py-4 transition hover:bg-white/5">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="font-medium text-slate-100">{faq.q}</span>
                                  <HelpCircle className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                                </div>
                              </summary>
                              <div className="px-5 pb-4 text-sm leading-7 text-slate-300">
                                {faq.a}
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat */}
              {activeTab === 'chat' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">Live Chat Support</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Send a quick message. Your chat message can also be saved to the database.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">
                    <div className="h-[420px] space-y-4 overflow-y-auto bg-[linear-gradient(to_bottom,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-4 sm:p-5">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg sm:max-w-md ${msg.sender === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'border border-white/10 bg-white/10 text-slate-100'
                              }`}
                          >
                            <p className="text-sm leading-6">{msg.message}</p>
                            <p
                              className={`mt-2 text-[11px] ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                                }`}
                            >
                              {formatTime(msg.time)}
                            </p>
                          </div>
                        </div>
                      ))}

                      <div ref={chatEndRef} />
                    </div>

                    <form
                      onSubmit={handleChatSubmit}
                      className="border-t border-white/10 bg-slate-950/80 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                        />
                        <button
                          type="submit"
                          disabled={isChatSubmitting}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isChatSubmitting ? (
                            <>
                              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Sending
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;