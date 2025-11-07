'use client'
import { useState, useRef, useEffect, ReactNode } from 'react'
import '@/styles/terminal.css'

// --- Tipe Data untuk Filesystem ---
interface FileNode {
  type: 'file'
  content: string
}

interface DirNode {
  type: 'dir'
  children: { [key: string]: FileNode | DirNode }
}

type FsNode = FileNode | DirNode

// --- Struktur Filesystem Awal ---
const initialFilesystem: DirNode = {
  type: 'dir',
  children: {
    home: {
      type: 'dir',
      children: {
        assistant: {
          type: 'dir',
          children: {
            'README.txt': {
              type: 'file',
              content: 'Welcome to the Virtual Lab! Try typing "help".',
            },
            projects: {
              type: 'dir',
              children: {
                'virtual-lab.js': {
                  type: 'file',
                  content: 'console.log("Hello World!");',
                },
              },
            },
          },
        },
      },
    },
    etc: {
      type: 'dir',
      children: {
        passwd: { type: 'file', content: 'root:x:0:0:root\nassistant:x:1000:1000:assistant' },
        hosts: { type: 'file', content: '127.0.0.1 localhost\n::1 localhost' },
      },
    },
    root: {
      type: 'dir',
      children: {
        '.secret': { type: 'file', content: 'sudo-is-not-real' },
      },
    },
  },
}

// --- Komponen Terminal ---
export default function TerminalSimulator() {
  const [lines, setLines] = useState<ReactNode[]>([
    'Welcome to Virtual Lab Terminal (v1.0.0)',
    'Type "help" for a list of commands.',
  ])
  const [input, setInput] = useState('')
  const [filesystem, setFilesystem] = useState<DirNode>(initialFilesystem)
  const [cwd, setCwd] = useState(['home', 'assistant']) // Current Working Directory
  
  const user = 'assistant'
  const host = 'vlab-sister'
  
  const terminalBodyRef = useRef<HTMLDivElement>(null)

  // Auto-scroll ke bawah
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight
    }
  }, [lines])

  // --- Helper: Path & Filesystem ---

  const getPathString = (pathSegments = cwd) => {
    if (pathSegments.length === 0) return '/'
    const path = pathSegments.join('/')
    // Ganti 'home/assistant' dengan '~'
    if (path === `home/${user}`) return '~'
    if (path.startsWith(`home/${user}/`)) {
      return `~/${path.substring(`home/${user}/`.length)}`
    }
    return `/${path}`
  }

  const resolvePath = (rawPath: string): string[] => {
    let newPathSegments: string[]
    
    if (rawPath.startsWith('/')) {
      newPathSegments = []
    } else if (rawPath.startsWith('~')) {
      newPathSegments = ['home', user]
      rawPath = rawPath.substring(1) // Hapus '~'
    } else {
      newPathSegments = [...cwd]
    }

    const parts = rawPath.split('/').filter(p => p.length > 0)

    for (const part of parts) {
      if (part === '.') {
        continue
      } else if (part === '..') {
        if (newPathSegments.length > 0) {
          newPathSegments.pop()
        }
      } else if (part.length > 0) {
        newPathSegments.push(part)
      }
    }
    return newPathSegments
  }

  const findNode = (pathSegments: string[]): FsNode | null => {
    let currentNode: FsNode = filesystem
    for (const part of pathSegments) {
      if (currentNode.type === 'file' || !currentNode.children[part]) {
        return null // Path tidak valid
      }
      currentNode = currentNode.children[part]
    }
    return currentNode
  }

  const findParentNode = (pathSegments: string[]): DirNode | null => {
    if (pathSegments.length === 0) return null // Root tidak punya parent
    const parentPath = [...pathSegments]
    parentPath.pop()
    const node = findNode(parentPath)
    return node?.type === 'dir' ? node : null
  }
  
  // --- Command Handlers ---

  const addLine = (line: ReactNode) => {
    setLines(prev => [...prev, line])
  }

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input) return

    const fullCommand = input.trim()
    const [command, ...args] = fullCommand.split(/\s+/).filter(s => s.length > 0)
    
    // Tambahkan command ke history
    addLine(<Prompt path={getPathString()} user={user} host={host} command={fullCommand} />)
    setInput('')

    switch (command) {
      case 'help':
        addLine(
          <div className="text-white">
            <p>Available commands:</p>
            <ul className="list-disc list-inside ml-4">
              <li><span className="terminal-cmd">help</span>: Show this message</li>
              <li><span className="terminal-cmd">ls [path]</span>: List directory contents</li>
              <li><span className="terminal-cmd">cd [path]</span>: Change directory</li>
              <li><span className="terminal-cmd">pwd</span>: Print working directory</li>
              <li><span className="terminal-cmd">whoami</span>: Print current user</li>
              <li><span className="terminal-cmd">cat [file]</span>: Print file content</li>
              <li><span className="terminal-cmd">touch [file]</span>: Create an empty file</li>
              <li><span className="terminal-cmd">mkdir [dir]</span>: Create a new directory</li>
              <li><span className="terminal-cmd">rm [file/dir]</span>: Remove a file or directory</li>
              <li><span className="terminal-cmd">sudo</span>: (Simulated)</li>
              <li><span className="terminal-cmd">clear</span>: Clear the terminal screen</li>
            </ul>
          </div>
        )
        break

      case 'clear':
        setLines([])
        break

      case 'whoami':
        addLine(user)
        break

      case 'pwd':
        addLine(`/${cwd.join('/')}`)
        break

      case 'ls':
        const lsPath = resolvePath(args[0] || '.')
        const lsNode = findNode(lsPath)
        if (!lsNode) {
          addLine(`ls: cannot access '${args[0]}': No such file or directory`)
        } else if (lsNode.type === 'file') {
          addLine(args[0])
        } else {
          const items = Object.keys(lsNode.children).map(name => {
            const child = lsNode.children[name]
            const className = child.type === 'dir' ? 'terminal-dir' : 'terminal-file'
            return <span key={name} className={className}>{name}</span>
          })
          addLine(<div className="flex flex-wrap gap-x-4">{items}</div>)
        }
        break

      case 'cd':
        const cdPath = resolvePath(args[0] || '~')
        const cdNode = findNode(cdPath)
        if (!cdNode) {
          addLine(`cd: no such file or directory: ${args[0]}`)
        } else if (cdNode.type === 'file') {
          addLine(`cd: not a directory: ${args[0]}`)
        } else {
          setCwd(cdPath)
        }
        break

      case 'cat':
        if (!args[0]) {
          addLine('usage: cat [file]')
          break
        }
        const catPath = resolvePath(args[0])
        const catNode = findNode(catPath)
        if (!catNode) {
          addLine(`cat: ${args[0]}: No such file or directory`)
        } else if (catNode.type === 'dir') {
          addLine(`cat: ${args[0]}: Is a directory`)
        } else {
          addLine(<pre className="whitespace-pre-wrap">{catNode.content}</pre>)
        }
        break

      case 'mkdir':
      case 'touch':
        if (!args[0]) {
          addLine(`usage: ${command} [name]`)
          break
        }
        const newPathStr = args[0]
        const newPath = resolvePath(newPathStr)
        const newName = newPath[newPath.length - 1]
        const parentNode = findParentNode(newPath)
        
        if (!parentNode) {
          addLine(`${command}: cannot create: Invalid path`)
        } else if (parentNode.children[newName]) {
          addLine(`${command}: cannot create: '${newName}': File exists`)
        } else {
          const newNode: FsNode = command === 'mkdir'
            ? { type: 'dir', children: {} }
            : { type: 'file', content: '' }
          
          // MUTASI: Hati-hati. Kita perlu clone untuk memicu re-render
          const newFs = JSON.parse(JSON.stringify(filesystem))
          const parentInNewFs = findNode(newPath.slice(0, -1)) as DirNode
          parentInNewFs.children[newName] = newNode
          setFilesystem(newFs)
        }
        break

      case 'rm':
        if (!args[0]) {
          addLine('usage: rm [file/dir]')
          break
        }
        const rmPath = resolvePath(args[0])
        const rmName = rmPath[rmPath.length - 1]
        const rmParent = findParentNode(rmPath)
        
        if (!rmParent || !rmParent.children[rmName]) {
          addLine(`rm: cannot remove '${args[0]}': No such file or directory`)
        } else {
          // MUTASI
          const newFs = JSON.parse(JSON.stringify(filesystem))
          const parentInNewFs = findNode(rmPath.slice(0, -1)) as DirNode
          delete parentInNewFs.children[rmName]
          setFilesystem(newFs)
        }
        break

      case 'sudo':
        if (fullCommand === 'sudo rm -rf /') {
          addLine('Ah ah ah! You didn\'t say the magic word!')
          addLine(<span className="text-yellow-400">Seriously, don't try that. (Even though this one is fake)</span>)
          break
        }
        addLine(`User "${user}" is not in the sudoers file. This incident will be reported.`)
        break

      default:
        addLine(`Command not found: ${command}. Type "help" for a list of commands.`)
    }
  }

  return (
    <div className="terminal">
      <div className="terminal-header">Simulated Shell</div>
      <div className="terminal-body" ref={terminalBodyRef} onClick={() => document.getElementById('terminal-input')?.focus()}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        <form onSubmit={handleCommand} className="flex">
          <Prompt path={getPathString()} user={user} host={host} />
          <input
            id="terminal-input"
            className="terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      </div>
    </div>
  )
}

// Komponen helper untuk prompt
function Prompt({ path, user, host, command }: { path: string, user: string, host: string, command?: string }) {
  if (command !== undefined) {
    // Ini untuk baris history
    return (
      <div>
        <span className="terminal-prompt-user">{user}@{host}</span>
        <span className="text-gray-400">:</span>
        <span className="terminal-prompt-path">{path}</span>
        <span className="text-gray-400">$ </span>
        <span>{command}</span>
      </div>
    )
  }
  // Ini untuk baris input aktif
  return (
    <div className="flex-shrink-0">
      <span className="terminal-prompt-user">{user}@{host}</span>
      <span className="text-gray-400">:</span>
      <span className="terminal-prompt-path">{path}</span>
      <span className="text-gray-400">$ </span>
    </div>
  )
}