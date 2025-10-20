"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Database, Trash2, Upload, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"

interface ProgressMessage {
  stage: string
  message: string
  collection?: string
  count?: number
  progress?: { current: number; total: number }
  completed?: boolean
  results?: SeedResults
}

interface SeedResults {
  cleared: {
    assets: number
    transporters: number
    companies: number
    users: number
    templates: number
    roles: number
  }
  seeded: {
    assets: number
    transporters: number
    companies: number
    users: number
    templates: number
    roles: number
  }
}

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [results, setResults] = useState<SeedResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSeed = async () => {
    setIsSeeding(true)
    setError(null)
    setResults(null)
    setProgressMessages([])

    try {
      const response = await fetch("/api/seed")
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("Failed to get response reader")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split("\n\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6)) as ProgressMessage
            setProgressMessages(prev => [...prev, data])

            if (data.stage === "complete" && data.results) {
              setResults(data.results)
            }

            if (data.stage === "error") {
              setError(data.message)
            }

            setTimeout(scrollToBottom, 100)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed database")
    } finally {
      setIsSeeding(false)
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "clearing":
        return <Trash2 className="w-4 h-4" />
      case "seeding_transporters":
      case "seeding_assets":
        return <Upload className="w-4 h-4" />
      case "complete":
        return <CheckCircle2 className="w-4 h-4" />
      case "error":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <ArrowRight className="w-4 h-4" />
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "clearing":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      case "seeding_transporters":
      case "seeding_assets":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      case "complete":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      case "error":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      default:
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Database className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Database Seeder
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center text-gray-600 dark:text-gray-300 mb-8">
            Clear and repopulate your database with fresh data
          </motion.p>

          {/* Info Cards */}
          {!isSeeding && progressMessages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3 mb-2">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h3 className="font-semibold text-red-900 dark:text-red-100">Clear Data</h3>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">All existing companies, users, products, clients, sites, groups, transporters, assets, roles, and notification templates will be deleted from the database.</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-2">
                  <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Seed Data</h3>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Seeds: Dev Company (Mine) with order config & escalation settings, 2 login users (dev@newton.co.za, admin@newton.co.za), 10 contact users, 6 products, 2 clients, 4 sites, 6 organizational groups, default roles with permissions, notification templates, 2 transporters, and production asset data from assets-data.json (if available).
                </p>
              </div>
            </motion.div>
          )}

          {/* Progress Messages */}
          {progressMessages.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Progress</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {progressMessages.map((msg, index) => (
                    <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className={`flex items-start gap-3 p-3 rounded-xl border ${getStageColor(msg.stage)}`}>
                      <div className="mt-0.5">{getStageIcon(msg.stage)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{msg.message}</p>
                        {msg.progress && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>
                                {msg.progress.current} / {msg.progress.total}
                              </span>
                              <span>{Math.round((msg.progress.current / msg.progress.total) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${(msg.progress.current / msg.progress.total) * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-gradient-to-r from-purple-500 to-pink-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </motion.div>
          )}

          {/* Seed Button */}
          {!results && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3">
                {isSeeding ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Seeding Database...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-6 h-6" />
                    <span>Start Seeding</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Final Results */}
          {results && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100">Success!</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {(
                      [
                        { label: "Companies", cleared: results.cleared.companies, seeded: results.seeded.companies },
                        { label: "Users", cleared: results.cleared.users, seeded: results.seeded.users },
                        { label: "Roles", cleared: results.cleared.roles, seeded: results.seeded.roles },
                        { label: "Notification Templates", cleared: results.cleared.templates, seeded: results.seeded.templates },
                        { label: "Transporters", cleared: results.cleared.transporters, seeded: results.seeded.transporters },
                        { label: "Assets", cleared: results.cleared.assets, seeded: results.seeded.assets },
                      ] as const
                    ).map(metric => (
                      <div key={metric.label} className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{metric.label}</h4>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Cleared</span>
                          <span>Seeded</span>
                        </div>
                        <div className="flex items-center justify-between text-2xl font-bold text-green-600 dark:text-green-400">
                          <span>{metric.cleared}</span>
                          <span>{metric.seeded}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setResults(null)
                  setProgressMessages([])
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                Seed Again
              </button>
            </motion.div>
          )}

          {/* Error */}
          {error && !results && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="text-xl font-bold text-red-900 dark:text-red-100">Error</h3>
                  <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
