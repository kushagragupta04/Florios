import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatTime, formatRate, formatTimeRemaining, getProgressBarColor } from "../../utils/formatters";
import HistoryModal from "../HistoryModal/HistoryModal";

function InfusionCard({ data, history, graphType, alarmThreshold }) {
    const {
        bottle_id,
        timestamp,
        start_time,
        remaining_volume,
        current_level,
        infusion_rate,
        time_remaining,
        fill_h,
        current_percentage,
    } = data;

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const percentage = Math.round(current_percentage || (remaining_volume / fill_h) * 100);
    const rateDisplay = formatRate(infusion_rate);
    const timeLeftDisplay = formatTimeRemaining(time_remaining, remaining_volume, infusion_rate);
    const progressBarColor = getProgressBarColor(percentage);
    const isBelowThreshold = remaining_volume < alarmThreshold && remaining_volume >= 0;

    // Prepare chart data
    const chartData = history
        .filter(point => point.time && point.remaining_volume != null)
        .map((point) => {
            // point.time is Unix timestamp in seconds
            const pointTime = point.time * 1000; // Convert to milliseconds
            const startTime = (start_time || timestamp) * 1000; // Convert to milliseconds
            const minutesElapsed = (pointTime - startTime) / (1000 * 60); // Minutes since start
            
            return {
                time: minutesElapsed, // X-axis: minutes elapsed
                timeLabel: formatTime(point.time), // For tooltip
                remaining_volume: Math.round(point.remaining_volume * 10) / 10,
                infusion_rate: point.infusion_rate != null 
                    ? Math.round(point.infusion_rate * 10) / 10 
                    : null, // Already in ml/min from backend
            };
        })
        .sort((a, b) => a.time - b.time); // Sort by time

    // Chart configuration based on graph type
    const chartConfig = {
        remaining_volume: {
            dataKey: "remaining_volume",
            name: "Remaining Volume",
            unit: "ml",
            color: "#3b82f6",
            yAxisLabel: "Volume (ml)",
        },
        infusion_rate: {
            dataKey: "infusion_rate",
            name: "Infusion Rate",
            unit: "ml/min",
            color: "#10b981",
            yAxisLabel: "Rate (ml/min)",
        },
    };

    const config = chartConfig[graphType];

    return (
        <>
            <div className="bg-white rounded-xl p-5 shadow-md mb-5 w-full">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-lg font-semibold text-green-800">
                            Bottle {bottle_id}
                        </div>
                        <button
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="px-3 py-1.5 text-s font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            View History
                        </button>
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                        <div>Updated: {formatTime(timestamp)}</div>
                    </div>
                </div>

                {/* Low Limit Alert */}
                {isBelowThreshold && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-red-600 font-bold text-sm">⚠</span>
                            <span className="text-red-700 font-semibold text-sm">
                                Low Limit Detected ({remaining_volume.toFixed(1)} ml &lt; {alarmThreshold} ml)
                            </span>
                        </div>
                    </div>
                )}

                {/* Main Content - Info on Left, Graph on Right */}
                <div className="flex gap-4">
                    {/* Left Side - Bottle Info */}
                    <div className="flex flex-col gap-4 shrink-0 w-64">
                        {/* Remaining Volume */}
                        <div>
                            <div className="text-2xl font-bold text-black mb-1">
                                {Math.round(remaining_volume)} ml
                            </div>
                            <div className="text-xs text-gray-600">
                                Total: {fill_h} ml
                            </div>
                        </div>

                        {/* Percentage */}
                        <div>
                            <div className="text-lg text-black font-medium mb-2">
                                {percentage}%
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full h-6 bg-gray-200 rounded-lg relative border border-gray-300 overflow-hidden">
                                <div
                                    className="absolute bottom-0 left-0 h-full transition-all duration-300 ease-out"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: progressBarColor,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Details */}
                        <div className="text-sm text-black leading-relaxed space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Start Time:</span>
                                <span className="font-medium">{formatTime(start_time)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Current Level:</span>
                                <span className="font-medium">{current_level.toFixed(1)} ml</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Rate:</span>
                                <span className="font-medium">{rateDisplay} ml/min</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Time Left:</span>
                                <span className="font-medium">{timeLeftDisplay}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Graph */}
                    {chartData.length > 0 && (
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-700 mb-2">
                                {config.name} vs Time
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="time"
                                        type="number"
                                        scale="linear"
                                        domain={['auto', 'auto']}
                                        hide={true}
                                    />
                                    <YAxis
                                        label={{ value: config.yAxisLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '11px', fill: '#666' } }}
                                        tick={{ fontSize: 10, fill: '#666' }}
                                        tickFormatter={(value) =>
                                            typeof value === 'number' && !isNaN(value) 
                                                ? `${value.toFixed(1)}` 
                                                : '--'
                                        }
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                        }}
                                        labelFormatter={(value, payload) => {
                                            if (payload && payload[0]) {
                                                return `Time: ${payload[0].payload.timeLabel}`;
                                            }
                                            return `Time: ${value.toFixed(1)}m`;
                                        }}
                                        formatter={(value) => [
                                            typeof value === 'number' && !isNaN(value)
                                                ? `${value.toFixed(1)} ${config.unit}`
                                                : '--',
                                            config.name,
                                        ]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={config.dataKey}
                                        stroke={config.color}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 5 }}
                                        isAnimationActive={false}
                                        connectNulls={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* History Modal */}
            <HistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                bottleId={bottle_id}
                history={history}
            />
        </>
    );
}

export default InfusionCard;
