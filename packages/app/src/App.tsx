import { Routes } from '#components/Routes'
import { appRoutes } from '#data/routes'
import type { FC } from 'react'
import { Router } from 'wouter'

interface AppProps {
  routerBase?: string
}

export const App: FC<AppProps> = ({ routerBase }) => {
  return (
    <Router base={routerBase}>
      <Routes
        routes={appRoutes}
        list={{
          home: {
            component: async () => await import('#pages/SyncHomePage')
          }
        }}
      />
    </Router>
  )
}
