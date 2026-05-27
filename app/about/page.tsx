import Link from "next/link"
import { IconArrowLeft, IconMail, IconUser } from "@tabler/icons-react"

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Nino Verstraeten",
      studentId: "2469197",
      email: "nino.verstraeten@student.uhasselt.be",
    },
    {
      name: "Kobe Van Laere",
      studentId: "2468822",
      email: "kobe.vanlaere@student.uhasselt.be",
    },
    {
      name: "Luca Desmet",
      studentId: "2469191",
      email: "luca.desmet@student.uhasselt.be",
    },
  ]

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,oklch(0.93_0.03_150/0.5),transparent_55%),linear-gradient(to_bottom,oklch(1_0_0),oklch(0.98_0.01_140))] px-4 py-8 flex items-center justify-center">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <section className="flex flex-col gap-6 rounded-2xl border border-border bg-card/90 p-8 backdrop-blur text-center">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
          
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold">About & Credits</h1>
            <p className="text-sm text-muted-foreground mx-auto max-w-lg">
              This project was created for the Information Visualization course of the academic year 2025-2026 by the following team members:
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 mt-4 text-left">
            {teamMembers.map((member) => (
              <div 
                key={member.studentId}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <IconUser size={20} />
                  </div>
                  <div>
                    <h2 className="font-mono text-base font-semibold tracking-wide">{member.name}</h2>
                    <p className="text-xs text-muted-foreground">Student ID: {member.studentId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <IconMail size={16} className="text-primary/70" />
                  <a href={`mailto:${member.email}`} className="hover:text-primary transition-colors">
                    {member.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
