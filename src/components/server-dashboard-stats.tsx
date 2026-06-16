import React from 'react';
import { Cpu, Server, Wifi, Activity } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { formatSpeed } from '@/lib/utils';
import {
  StatCard,
  LastUpdated,
  TrafficDisplay
} from './dashboard';

// 服务器数据接口
interface ServerData {
  servers: Array<{
    online?: boolean;
    online4?: boolean;
    online6?: boolean;
    uptime?: string;
    cpu?: number;
    network_rx?: number;
    network_tx?: number;
    network_in?: number;
    network_out?: number;
  }>;
  updated?: number; // 修改为 number 类型
}

interface ServerDashboardStatsProps {
  data?: ServerData;
}

export const ServerDashboardStats: React.FC<ServerDashboardStatsProps> = ({ data }) => {
  // 计算统计数据
  const stats = React.useMemo(() => {
    if (!data?.servers) {
      return {
        totalServers: 0,
        onlineServers: 0,
        avgCpuUsage: 0,
        totalNetworkRx: 0,
        totalNetworkTx: 0,
        totalDownload: 0,
        totalUpload: 0,
      };
    }

    const onlineServers = data.servers.filter((server) => {
      const ipOnline = Boolean(server.online4 || server.online6);
      if (typeof server.online === 'boolean') return server.online || ipOnline;
      return ipOnline || (server.uptime && server.uptime !== '');
    }).length;
    const totalServers = data.servers.length;

    let totalCpu = 0;
    let totalNetworkRx = 0;
    let totalNetworkTx = 0;
    let totalDownload = 0;
    let totalUpload = 0;

    data.servers.forEach((server) => {
      const isOnline = (typeof server.online === 'boolean')
        ? (server.online || Boolean(server.online4 || server.online6))
        : (Boolean(server.online4 || server.online6) || (server.uptime && server.uptime !== ''));
      if (isOnline) {
        totalCpu += server.cpu || 0;
        totalNetworkRx += server.network_rx || 0;
        totalNetworkTx += server.network_tx || 0;
        totalDownload += server.network_in || 0;
        totalUpload += server.network_out || 0;
      }
    });

    const avgCpuUsage = onlineServers ? Math.round(totalCpu / onlineServers) : 0;

    return {
      totalServers,
      onlineServers,
      avgCpuUsage,
      totalNetworkRx,
      totalNetworkTx,
      totalDownload,
      totalUpload,
    };
  }, [data?.servers]);

  const lastUpdated = React.useMemo(() => {
    if (!data?.updated) return '未知';
    return formatDateTime(data.updated * 1000);
  }, [data?.updated]);

  const isLoading = !data?.servers;

  if (isLoading) {
    return (
      <div className="stats-container">
        <div className="flex justify-between items-center dashboard-title">
          <h1 className="text-2xl font-bold tracking-tight" suppressHydrationWarning>
            监控概览
          </h1>
          <div className="h-8 w-32 skeleton rounded-md" />
        </div>
        <div className="stats-grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-secondary mr-4">
                    <div className="h-6 w-6 skeleton rounded" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-16 skeleton rounded" />
                    <div className="h-6 w-24 skeleton rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="flex justify-between items-center dashboard-title">
        <h1
          className="text-2xl font-bold tracking-tight"
          suppressHydrationWarning
        >
          监控概览
        </h1>

        <LastUpdated timestamp={lastUpdated} />
      </div>

      <div className="stats-grid">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="服务器"
            value={
              <div className="flex items-baseline">
                {stats.totalServers > 0 ? (
                  <>
                    <span className="text-2xl font-bold leading-tight transition-all duration-300">{stats.onlineServers}</span>
                    <span className="text-xs opacity-70 mx-1.5">/</span>
                    <span className="text-xl font-bold opacity-80 transition-all duration-300">{stats.totalServers}</span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-muted-foreground">—</span>
                )}
              </div>
            }
            icon={<Server className="h-6 w-6" />}
          />
          <StatCard
            title="平均CPU使用率"
            value={
              <div className="flex items-baseline">
                {stats.totalServers > 0 ? (
                  <>
                    <span className="text-2xl font-bold leading-tight transition-all duration-300">{stats.avgCpuUsage}</span>
                    <span className="text-xs opacity-70 ml-1">%</span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-muted-foreground">—</span>
                )}
              </div>
            }
            icon={<Cpu className="h-6 w-6" />}
          />
          <StatCard
            title="实时网络速率"
            value={
              <div className="flex items-baseline space-x-2 min-w-0">
                {stats.totalServers > 0 ? (
                  <>
                    <div className="flex items-baseline whitespace-nowrap">
                      <span className="text-sm font-medium opacity-70 flex-shrink-0">↓</span>
                      <span className="text-lg font-bold ml-1 font-mono leading-tight transition-all duration-300">{formatSpeed(stats.totalNetworkRx, 1)}</span>
                    </div>
                    <div className="flex items-baseline whitespace-nowrap">
                      <span className="text-sm font-medium opacity-70 flex-shrink-0">↑</span>
                      <span className="text-lg font-bold ml-1 font-mono leading-tight transition-all duration-300">{formatSpeed(stats.totalNetworkTx, 1)}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">—</span>
                )}
              </div>
            }
            icon={<Activity className="h-6 w-6" />}
          />
          <StatCard
            title="总流量"
            value={
              stats.totalServers > 0 ? (
                <TrafficDisplay
                  download={stats.totalDownload}
                  upload={stats.totalUpload}
                />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">—</span>
              )
            }
            icon={<Wifi className="h-6 w-6" />}
          />
        </div>
      </div>
    </div>
  );
};
