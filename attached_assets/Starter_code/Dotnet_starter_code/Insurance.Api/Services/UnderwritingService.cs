namespace Insurance.Api.Services;

public class UnderwritingService
{
    public object Evaluate(int age, string product, int priorClaims)
    {
        double risk = (age / 10.0) + (priorClaims * 5.0);
        if (string.Equals(product, "life", StringComparison.OrdinalIgnoreCase)) risk += 10;
        if (string.Equals(product, "home", StringComparison.OrdinalIgnoreCase)) risk += 5;
        var decision = risk < 10 ? "approve" : risk < 20 ? "review" : "decline";
        return new { riskScore = Math.Round(risk), decision };
    }
}


