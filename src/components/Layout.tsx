import type { ReactNode } from 'react'

import { logout } from '../services/auth'

import type { UserRole } from '../types/models'



interface Props {

  children: ReactNode

  email?: string | null

  role?: UserRole

  subtitle?: string

  name?: string | null

}



const Layout = ({ children, email, role, subtitle, name }: Props) => {

  return (

    <div className="app-shell">

      <div className="content-container">

        <header className="layout-header">

          <div>

            <h1 className="page-title">SmartMeter Vision</h1>

            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}

          </div>

          <div className="layout-meta">

            {role ? <span className="badge">Role: {role}</span> : null}

            {name ? <span className="pill">Name: {name}</span> : null}

            {email ? <span className="pill">{email}</span> : null}

            <button className="btn btn-ghost" onClick={() => logout()}>

              Logout

            </button>

          </div>

        </header>

        {children}

      </div>

    </div>

  )

}



export default Layout

